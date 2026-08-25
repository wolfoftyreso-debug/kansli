/**
 * RevolutTokenManager — the reason nobody has to think about the 40-minute
 * access token.
 *
 * Every Revolut call asks this module for a token. It refreshes ahead of expiry
 * with a safety margin, serialises refreshes across server instances with a
 * Postgres advisory lock, re-reads state after taking the lock so a second
 * instance reuses the token the first one just fetched, and persists a rotated
 * refresh token in the same statement as the new access token.
 */

import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { ASSERTION_TYPE, clientAssertionFromEnv } from "./assertion.ts";
import {
  assertProductionRevolutConfig,
  revolutClientId,
  revolutEnvironment,
  revolutKeyMatch,
  revolutRedirectUri,
  revolutTokenEndpoint,
  type Env,
  type RevolutEnvironment,
} from "./config.ts";
import {
  markActionRequired,
  markTransientError,
  persistTokens,
  readConnection,
  refreshLockKey,
  REVOLUT_PROVIDER,
  type LoadedConnection,
  type TokenSet,
} from "./connection.ts";
import { RevolutError, requiresReauthorization, tokenErrorCategory } from "./errors.ts";
import { logRevolut, logRevolutError } from "./observability.ts";

/** Refresh this long before Revolut's stated expiry. Never at the last second. */
export const REFRESH_MARGIN_MS = 5 * 60 * 1000;

/** Bounded wait for another instance's in-flight refresh. */
const LOCK_ATTEMPTS = 6;
const LOCK_WAIT_MS = 500;

/** No request to Revolut may hang. */
export const TOKEN_REQUEST_TIMEOUT_MS = 15_000;

interface TokenResponse {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
  scope?: unknown;
  error?: unknown;
  error_description?: unknown;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseScopes(value: unknown): string[] {
  if (typeof value === "string" && value.trim()) return value.trim().split(/[\s,]+/);
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

/**
 * One POST to Revolut's token endpoint. Form-encoded with a private_key_jwt
 * client assertion, as the Business API requires.
 */
async function postToken(
  grant: "authorization_code" | "refresh_token",
  fields: Record<string, string>,
  env: Env,
): Promise<TokenSet> {
  // Last gate before we actually talk to a bank: a production deployment with a
  // derived or non-https redirect URI must not get this far.
  try {
    assertProductionRevolutConfig(env);
  } catch (error) {
    throw new RevolutError(
      "configuration",
      error instanceof Error ? error.message : "Revolut-konfigurationen är ogiltig.",
      { cause: error },
    );
  }
  const clientId = revolutClientId(env);
  if (!clientId) {
    throw new RevolutError("configuration", "REVOLUT_CLIENT_ID saknas.");
  }
  // A key that is not the other half of the registered certificate cannot
  // produce an assertion Revolut will accept, in any environment. Saying so
  // here beats sending doomed calls and reading back `invalid_client`.
  const keyMatch = revolutKeyMatch(env);
  if (keyMatch.state === "mismatch") {
    throw new RevolutError("configuration", keyMatch.reason);
  }
  const assertion = await clientAssertionFromEnv(env);
  const body = new URLSearchParams({
    grant_type: grant,
    client_id: clientId,
    client_assertion_type: ASSERTION_TYPE,
    client_assertion: assertion,
    ...fields,
  });

  let response: Response;
  try {
    response = await fetch(revolutTokenEndpoint(env), {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body,
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    throw new RevolutError(
      timedOut ? "timeout" : "network",
      timedOut ? "Revolut svarade inte i tid." : "Nätverksfel mot Revolut.",
      { cause: error },
    );
  }

  let payload: TokenResponse;
  try {
    payload = (await response.json()) as TokenResponse;
  } catch (error) {
    throw new RevolutError("malformed_response", "Revolut svarade med något vi inte kunde tolka.", {
      status: response.status,
      cause: error,
    });
  }

  if (!response.ok) {
    const providerCode = typeof payload.error === "string" ? payload.error : null;
    throw new RevolutError(
      tokenErrorCategory(response.status, providerCode, grant),
      "Revolut godkände inte anslutningen.",
      { status: response.status, providerCode },
    );
  }

  const accessToken = payload.access_token;
  const expiresIn = Number(payload.expires_in);
  if (typeof accessToken !== "string" || !accessToken) {
    throw new RevolutError("malformed_response", "Svaret från Revolut var inte komplett.", {
      status: response.status,
    });
  }
  // Revolut states expires_in; if it ever stops doing so, assume the documented
  // 40 minutes rather than treating the token as eternal.
  const lifetimeSeconds = Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : 2400;

  return {
    accessToken,
    refreshToken: typeof payload.refresh_token === "string" ? payload.refresh_token : null,
    expiresAt: new Date(Date.now() + lifetimeSeconds * 1000),
    scopes: parseScopes(payload.scope),
  };
}

export function exchangeAuthorizationCode(code: string, env: Env = process.env): Promise<TokenSet> {
  return postToken("authorization_code", { code, redirect_uri: revolutRedirectUri(env) }, env);
}

export function requestRefresh(refreshToken: string, env: Env = process.env): Promise<TokenSet> {
  return postToken("refresh_token", { refresh_token: refreshToken }, env);
}

export interface TokenManagerDeps {
  pool: pg.Pool;
  orgRef: string;
  environment?: RevolutEnvironment;
  events?: EventLog | null;
  actorRef?: string | null;
  requestId?: string | null;
  env?: Env;
  /** Injected in tests to drive the refresh path without a real Revolut. */
  refresh?: (refreshToken: string) => Promise<TokenSet>;
  now?: () => Date;
}

function tokenIsFresh(loaded: LoadedConnection, now: Date, marginMs = REFRESH_MARGIN_MS): boolean {
  if (!loaded.credentials.accessToken) return false;
  if (!loaded.connection.accessTokenExpiresAt) return false;
  const expiry = new Date(loaded.connection.accessTokenExpiresAt).getTime();
  return expiry - now.getTime() > marginMs;
}

export class ReauthorizationRequired extends Error {
  constructor(readonly code: string) {
    super("Revolut-anslutningen måste göras om.");
    this.name = "ReauthorizationRequired";
  }
}

/**
 * The one entry point. Returns a token that is valid now and will stay valid
 * for at least the safety margin.
 */
export async function getValidAccessToken(deps: TokenManagerDeps): Promise<string> {
  const env = deps.env ?? process.env;
  const environment = deps.environment ?? revolutEnvironment(env);
  const now = deps.now ?? (() => new Date());

  const loaded = await readConnection(deps.pool, deps.orgRef, environment);
  if (!loaded) throw new ReauthorizationRequired("not_configured");
  if (loaded.connection.status === "revoked" || loaded.connection.status === "action_required") {
    throw new ReauthorizationRequired(loaded.connection.lastErrorCode ?? loaded.connection.status);
  }
  if (tokenIsFresh(loaded, now())) return loaded.credentials.accessToken!;

  const refreshed = await refreshWithLock(deps, environment, env);
  return refreshed.credentials.accessToken!;
}

async function refreshWithLock(
  deps: TokenManagerDeps,
  environment: RevolutEnvironment,
  env: Env,
): Promise<LoadedConnection> {
  const now = deps.now ?? (() => new Date());
  const lockKey = refreshLockKey(deps.orgRef, environment);
  const refresh = deps.refresh ?? ((token: string) => requestRefresh(token, env));

  for (let attempt = 1; attempt <= LOCK_ATTEMPTS; attempt += 1) {
    let waitAndRetry = false;
    const client = await deps.pool.connect();
    try {
      await client.query("begin");
      const { rows } = await client.query<{ ok: boolean }>(
        "select pg_try_advisory_xact_lock(hashtext($1::text)) as ok",
        [lockKey],
      );
      if (!rows[0]?.ok) {
        await client.query("rollback");
        waitAndRetry = true;
      } else {
        // Someone else may have refreshed between our first read and this lock.
        const fresh = await readConnection(client, deps.orgRef, environment);
        if (!fresh) {
          await client.query("rollback");
          throw new ReauthorizationRequired("not_configured");
        }
        if (tokenIsFresh(fresh, now())) {
          await client.query("rollback");
          logRevolut("token.refresh_skipped", {
            orgRef: deps.orgRef,
            connectionId: fresh.connection.id,
            environment,
            attempt,
          });
          return fresh;
        }
        if (!fresh.credentials.refreshToken) {
          await client.query("rollback");
          await onPermanentFailure(deps, environment, "missing_refresh_token");
          throw new ReauthorizationRequired("missing_refresh_token");
        }

        await client.query(
          `update ekonomi.integration_connections set refresh_lock_at = now()
            where org_ref = $1 and provider = $2 and environment = $3`,
          [deps.orgRef, REVOLUT_PROVIDER, environment],
        );

        const tokens = await refresh(fresh.credentials.refreshToken);
        const connection = await persistTokens(client, {
          orgRef: deps.orgRef,
          environment,
          tokens,
        });
        await client.query("commit");

        logRevolut("token.refreshed", {
          orgRef: deps.orgRef,
          connectionId: connection.id,
          environment,
          attempt,
          expiresInSeconds: Math.round((tokens.expiresAt.getTime() - now().getTime()) / 1000),
          rotatedRefreshToken: Boolean(tokens.refreshToken),
        });

        return {
          connection,
          credentials: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken ?? fresh.credentials.refreshToken,
          },
        };
      }
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      if (error instanceof ReauthorizationRequired) throw error;
      logRevolutError("token.refresh_failed", error, {
        orgRef: deps.orgRef,
        environment,
        attempt,
      });
      if (requiresReauthorization(error)) {
        const code =
          error instanceof RevolutError
            ? (error.providerCode ?? error.category)
            : "refresh_rejected";
        await onPermanentFailure(deps, environment, code);
        throw new ReauthorizationRequired(code);
      }
      await markTransientError(deps.pool, {
        orgRef: deps.orgRef,
        environment,
        errorCode: error instanceof RevolutError ? error.category : "unknown",
      }).catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }

    if (waitAndRetry) {
      await sleep(LOCK_WAIT_MS);
      const fresh = await readConnection(deps.pool, deps.orgRef, environment);
      if (fresh && tokenIsFresh(fresh, now())) {
        logRevolut("token.refresh_skipped", {
          orgRef: deps.orgRef,
          connectionId: fresh.connection.id,
          environment,
          attempt,
        });
        return fresh;
      }
    }
  }

  throw new RevolutError(
    "timeout",
    "En annan förnyelse av Revolut-anslutningen blev inte klar i tid.",
  );
}

/** Only a dead grant gets here. This is what turns the UI into "Reconnect". */
async function onPermanentFailure(
  deps: TokenManagerDeps,
  environment: RevolutEnvironment,
  errorCode: string,
): Promise<void> {
  await markActionRequired(deps.pool, {
    orgRef: deps.orgRef,
    environment,
    errorCode,
  }).catch(() => undefined);
  logRevolut("connection.action_required", {
    orgRef: deps.orgRef,
    environment,
    providerCode: errorCode,
  });
  if (!deps.events) return;
  await deps.events
    .publish({
      system: "ekonomi",
      kind: "ekonomi.revolut.connection.action_required",
      orgRef: deps.orgRef,
      actorKind: "system",
      actorRef: deps.actorRef ?? "system",
      subjectRef: `ekonomi:connection:revolut:${environment}`,
      requestId: deps.requestId ?? null,
      payload: { title: "Revolut behöver anslutas om", reason: errorCode, environment },
    })
    .catch(() => undefined);
}
