/**
 * Persistence for the Revolut connection.
 *
 * Token material is encrypted with the wrap key Ekonomi already uses for
 * connector secrets — this module does not invent a second crypto stack.
 * Callers get a `RevolutConnection` (safe to render) separately from
 * `RevolutCredentials` (server-only), so a token cannot fall into a response
 * body by accident.
 */

import type pg from "pg";
import { decryptSecret, encryptSecret } from "../connectors.ts";
import type { RevolutEnvironment } from "./config.ts";

export const REVOLUT_PROVIDER = "revolut_business" as const;

/**
 * `refreshing` is derived, never stored: it means a refresh currently holds the
 * advisory lock. Persisting it would let a crashed process wedge the row.
 */
export type ConnectionStatus =
  | "not_configured"
  | "pending_authorization"
  | "active"
  | "refreshing"
  | "action_required"
  | "revoked"
  | "error";

export type StoredConnectionStatus = Exclude<ConnectionStatus, "refreshing">;

export interface RevolutConnection {
  id: string;
  orgRef: string;
  environment: RevolutEnvironment;
  status: StoredConnectionStatus;
  externalAccountReference: string | null;
  accessTokenExpiresAt: string | null;
  scopes: string[];
  refreshLockAt: string | null;
  lastSuccessAt: string | null;
  lastRefreshAt: string | null;
  lastErrorCode: string | null;
  lastErrorAt: string | null;
  connectedAt: string | null;
  connectedBy: string | null;
  hasRefreshToken: boolean;
}

export interface RevolutCredentials {
  accessToken: string | null;
  refreshToken: string | null;
}

export interface LoadedConnection {
  connection: RevolutConnection;
  credentials: RevolutCredentials;
}

type Queryable = Pick<pg.Pool, "query">;

interface Row {
  id: string;
  org_ref: string;
  environment: string;
  status: string;
  external_account_reference: string | null;
  encrypted_access_token: string | null;
  encrypted_refresh_token: string | null;
  access_token_expires_at: Date | null;
  scopes: string[] | null;
  refresh_lock_at: Date | null;
  last_success_at: Date | null;
  last_refresh_at: Date | null;
  last_error_code: string | null;
  last_error_at: Date | null;
  connected_at: Date | null;
  connected_by: string | null;
}

const COLUMNS = `id, org_ref, environment, status, external_account_reference,
  encrypted_access_token, encrypted_refresh_token, access_token_expires_at, scopes,
  refresh_lock_at, last_success_at, last_refresh_at, last_error_code, last_error_at,
  connected_at, connected_by`;

function iso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function toConnection(row: Row): RevolutConnection {
  return {
    id: row.id,
    orgRef: row.org_ref,
    environment: row.environment as RevolutEnvironment,
    status: row.status as StoredConnectionStatus,
    externalAccountReference: row.external_account_reference,
    accessTokenExpiresAt: iso(row.access_token_expires_at),
    scopes: row.scopes ?? [],
    refreshLockAt: iso(row.refresh_lock_at),
    lastSuccessAt: iso(row.last_success_at),
    lastRefreshAt: iso(row.last_refresh_at),
    lastErrorCode: row.last_error_code,
    lastErrorAt: iso(row.last_error_at),
    connectedAt: iso(row.connected_at),
    connectedBy: row.connected_by,
    hasRefreshToken: Boolean(row.encrypted_refresh_token),
  };
}

function toCredentials(row: Row): RevolutCredentials {
  return {
    accessToken: row.encrypted_access_token ? decryptSecret(row.encrypted_access_token) : null,
    refreshToken: row.encrypted_refresh_token ? decryptSecret(row.encrypted_refresh_token) : null,
  };
}

function toLoaded(row: Row): LoadedConnection {
  return { connection: toConnection(row), credentials: toCredentials(row) };
}

/** Advisory-lock key. One refresh per org + provider + environment at a time. */
export function refreshLockKey(orgRef: string, environment: RevolutEnvironment): string {
  return `pixdrift.revolut.refresh:${environment}:${orgRef}`;
}

export async function readConnection(
  db: Queryable,
  orgRef: string,
  environment: RevolutEnvironment,
): Promise<LoadedConnection | null> {
  const { rows } = await db.query<Row>(
    `select ${COLUMNS} from ekonomi.integration_connections
      where org_ref = $1 and provider = $2 and environment = $3`,
    [orgRef, REVOLUT_PROVIDER, environment],
  );
  return rows[0] ? toLoaded(rows[0]) : null;
}

/** Creates the row in `pending_authorization` if it does not exist yet. */
export async function ensurePendingConnection(
  db: Queryable,
  orgRef: string,
  environment: RevolutEnvironment,
): Promise<RevolutConnection> {
  const { rows } = await db.query<Row>(
    `insert into ekonomi.integration_connections (id, org_ref, provider, environment, status)
     values ($1, $2, $3, $4, 'pending_authorization')
     on conflict (org_ref, provider, environment) do update
       set updated_at = now()
     returning ${COLUMNS}`,
    [crypto.randomUUID(), orgRef, REVOLUT_PROVIDER, environment],
  );
  return toConnection(rows[0]!);
}

export interface TokenSet {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scopes?: string[];
}

/**
 * One consistent credential transition: access token, its expiry and any
 * rotated refresh token land in the same statement. A partially updated
 * credential state is never visible to another request.
 */
export async function persistTokens(
  db: Queryable,
  input: {
    orgRef: string;
    environment: RevolutEnvironment;
    tokens: TokenSet;
    actorRef?: string | null;
    markConnected?: boolean;
  },
): Promise<RevolutConnection> {
  const access = encryptSecret(input.tokens.accessToken);
  // Revolut does not always rotate the refresh token. Keep the existing one
  // unless a new one arrived, and never blank it out on a plain refresh.
  const refresh = input.tokens.refreshToken ? encryptSecret(input.tokens.refreshToken) : null;
  const { rows } = await db.query<Row>(
    `insert into ekonomi.integration_connections
       (id, org_ref, provider, environment, status, encrypted_access_token,
        encrypted_refresh_token, access_token_expires_at, scopes,
        last_refresh_at, refresh_lock_at, last_error_code, last_error_at,
        connected_at, connected_by)
     values ($1, $2, $3, $4, 'active', $5, $6, $7, $8::text[], now(), null, null, null,
             case when $9::boolean then now() else null end,
             case when $9::boolean then $10::text else null end)
     on conflict (org_ref, provider, environment) do update
       set status = 'active',
           encrypted_access_token = excluded.encrypted_access_token,
           encrypted_refresh_token =
             coalesce(excluded.encrypted_refresh_token,
                      ekonomi.integration_connections.encrypted_refresh_token),
           access_token_expires_at = excluded.access_token_expires_at,
           scopes = case when array_length(excluded.scopes, 1) is null
                         then ekonomi.integration_connections.scopes
                         else excluded.scopes end,
           last_refresh_at = now(),
           refresh_lock_at = null,
           last_error_code = null,
           last_error_at = null,
           connected_at = coalesce(excluded.connected_at,
                                   ekonomi.integration_connections.connected_at),
           connected_by = coalesce(excluded.connected_by,
                                   ekonomi.integration_connections.connected_by),
           updated_at = now()
     returning ${COLUMNS}`,
    [
      crypto.randomUUID(),
      input.orgRef,
      REVOLUT_PROVIDER,
      input.environment,
      access.ciphertext,
      refresh?.ciphertext ?? null,
      input.tokens.expiresAt.toISOString(),
      input.tokens.scopes ?? [],
      input.markConnected ?? false,
      input.actorRef ?? null,
    ],
  );
  return toConnection(rows[0]!);
}

/**
 * The grant is gone. Destroy the unusable token material so nothing can keep
 * calling with it, keep the audit fields.
 */
export async function markActionRequired(
  db: Queryable,
  input: {
    orgRef: string;
    environment: RevolutEnvironment;
    errorCode: string;
    status?: Extract<StoredConnectionStatus, "action_required" | "revoked">;
  },
): Promise<void> {
  await db.query(
    `update ekonomi.integration_connections
        set status = $4,
            encrypted_access_token = null,
            encrypted_refresh_token = null,
            access_token_expires_at = null,
            refresh_lock_at = null,
            last_error_code = $3,
            last_error_at = now(),
            updated_at = now()
      where org_ref = $1 and provider = $5 and environment = $2`,
    [
      input.orgRef,
      input.environment,
      input.errorCode,
      input.status ?? "action_required",
      REVOLUT_PROVIDER,
    ],
  );
}

/**
 * Force the next token request to refresh. Used after Revolut answers 401 on a
 * token we believed was still inside its lifetime — the clock disagreed, so
 * stop trusting the cached expiry rather than retrying with the same token.
 */
export async function invalidateAccessToken(
  db: Queryable,
  input: { orgRef: string; environment: RevolutEnvironment },
): Promise<void> {
  await db.query(
    `update ekonomi.integration_connections
        set access_token_expires_at = now(), updated_at = now()
      where org_ref = $1 and provider = $3 and environment = $2`,
    [input.orgRef, input.environment, REVOLUT_PROVIDER],
  );
}

/** A transient failure. Credentials are kept; only the error fields move. */
export async function markTransientError(
  db: Queryable,
  input: { orgRef: string; environment: RevolutEnvironment; errorCode: string },
): Promise<void> {
  await db.query(
    `update ekonomi.integration_connections
        set last_error_code = $3,
            last_error_at = now(),
            refresh_lock_at = null,
            updated_at = now()
      where org_ref = $1 and provider = $4 and environment = $2`,
    [input.orgRef, input.environment, input.errorCode, REVOLUT_PROVIDER],
  );
}

export async function markSuccess(
  db: Queryable,
  input: { orgRef: string; environment: RevolutEnvironment; accountReference?: string | null },
): Promise<void> {
  await db.query(
    `update ekonomi.integration_connections
        set last_success_at = now(),
            external_account_reference =
              coalesce($3, external_account_reference),
            last_error_code = null,
            last_error_at = null,
            updated_at = now()
      where org_ref = $1 and provider = $4 and environment = $2`,
    [input.orgRef, input.environment, input.accountReference ?? null, REVOLUT_PROVIDER],
  );
}

export async function disconnect(
  db: Queryable,
  input: { orgRef: string; environment: RevolutEnvironment; actorRef: string },
): Promise<void> {
  await markActionRequired(db, {
    orgRef: input.orgRef,
    environment: input.environment,
    errorCode: "disconnected_by_owner",
    status: "revoked",
  });
}

// --- OAuth state -----------------------------------------------------------

export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export interface OAuthState {
  state: string;
  orgRef: string;
  environment: RevolutEnvironment;
  actorRef: string;
  redirectUri: string;
}

export async function createOAuthState(
  db: Queryable,
  input: {
    orgRef: string;
    environment: RevolutEnvironment;
    actorRef: string;
    redirectUri: string;
    ttlMs?: number;
  },
): Promise<string> {
  const state = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? OAUTH_STATE_TTL_MS));
  await db.query(
    `insert into ekonomi.integration_oauth_states
       (state, org_ref, provider, environment, actor_ref, redirect_uri, expires_at)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      state,
      input.orgRef,
      REVOLUT_PROVIDER,
      input.environment,
      input.actorRef,
      input.redirectUri,
      expiresAt.toISOString(),
    ],
  );
  // Opportunistic cleanup so the table cannot grow without bound.
  await db
    .query(
      `delete from ekonomi.integration_oauth_states where expires_at < now() - interval '1 day'`,
    )
    .catch(() => undefined);
  return state;
}

export type StateVerdict =
  | { ok: true; state: OAuthState }
  | { ok: false; reason: "state_invalid" | "state_expired" | "state_replayed" };

/**
 * Single use. The `consumed_at is null` predicate in the UPDATE is what makes
 * replay impossible even with two simultaneous callbacks.
 */
export async function consumeOAuthState(db: Queryable, state: string): Promise<StateVerdict> {
  if (!state) return { ok: false, reason: "state_invalid" };
  const { rows } = await db.query<{
    org_ref: string;
    environment: string;
    actor_ref: string;
    redirect_uri: string;
    expired: boolean;
  }>(
    `update ekonomi.integration_oauth_states
        set consumed_at = now()
      where state = $1 and consumed_at is null
      returning org_ref, environment, actor_ref, redirect_uri, (expires_at < now()) as expired`,
    [state],
  );
  const row = rows[0];
  if (!row) {
    const { rows: existing } = await db.query(
      `select 1 from ekonomi.integration_oauth_states where state = $1`,
      [state],
    );
    return { ok: false, reason: existing[0] ? "state_replayed" : "state_invalid" };
  }
  if (row.expired) return { ok: false, reason: "state_expired" };
  return {
    ok: true,
    state: {
      state,
      orgRef: row.org_ref,
      environment: row.environment as RevolutEnvironment,
      actorRef: row.actor_ref,
      redirectUri: row.redirect_uri,
    },
  };
}
