/**
 * The single Revolut Business API client.
 *
 * Business code never builds Revolut authentication by hand: it asks this
 * client, which asks the token manager. Every request has a timeout. A 401 gets
 * exactly one controlled refresh-and-retry — authentication retries are kept
 * separate from any business retry policy, and money-moving calls are not
 * retried here at all.
 */

import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { revolutApiBase, revolutEnvironment, type Env, type RevolutEnvironment } from "./config.ts";
import {
  invalidateAccessToken,
  markSuccess,
  markTransientError,
  type TokenSet,
} from "./connection.ts";
import { RevolutError, categoryFromStatus } from "./errors.ts";
import { logRevolut, logRevolutError } from "./observability.ts";
import { getValidAccessToken, ReauthorizationRequired } from "./tokens.ts";

export const API_REQUEST_TIMEOUT_MS = 20_000;

export interface RevolutAccount {
  id: string;
  name?: string;
  balance: number;
  currency: string;
  state?: string;
}

export interface RevolutTransactionLeg {
  amount: number;
  currency: string;
  description?: string;
}

export interface RevolutTransaction {
  id: string;
  type: string;
  state: string;
  created_at?: string;
  completed_at?: string;
  reference?: string;
  legs?: RevolutTransactionLeg[];
}

export interface RevolutClientOptions {
  pool: pg.Pool;
  orgRef: string;
  environment?: RevolutEnvironment;
  events?: EventLog | null;
  actorRef?: string | null;
  requestId?: string | null;
  env?: Env;
  /** Test seams. Production always goes through the token manager and global fetch. */
  accessTokenProvider?: () => Promise<string>;
  refresh?: (refreshToken: string) => Promise<TokenSet>;
  fetchImpl?: typeof fetch;
}

export class RevolutClient {
  private readonly environment: RevolutEnvironment;
  private readonly env: Env;
  private readonly doFetch: typeof fetch;

  constructor(private readonly options: RevolutClientOptions) {
    this.env = options.env ?? process.env;
    this.environment = options.environment ?? revolutEnvironment(this.env);
    this.doFetch = options.fetchImpl ?? fetch;
  }

  private token(): Promise<string> {
    if (this.options.accessTokenProvider) return this.options.accessTokenProvider();
    return getValidAccessToken({
      pool: this.options.pool,
      orgRef: this.options.orgRef,
      environment: this.environment,
      events: this.options.events ?? null,
      actorRef: this.options.actorRef ?? null,
      requestId: this.options.requestId ?? null,
      env: this.env,
      refresh: this.options.refresh,
    });
  }

  /** GET only. Anything that moves money needs its own idempotency handling. */
  async get<T>(path: string, query: Record<string, string> = {}): Promise<T> {
    return this.send<T>(path, query, 1);
  }

  private async send<T>(path: string, query: Record<string, string>, attempt: number): Promise<T> {
    const accessToken = await this.token();
    const url = new URL(`${revolutApiBase(this.env)}${path}`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    let response: Response;
    try {
      response = await this.doFetch(url, {
        headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" },
        signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      const failure = new RevolutError(
        timedOut ? "timeout" : "network",
        timedOut ? "Revolut svarade inte i tid." : "Nätverksfel mot Revolut.",
        { cause: error },
      );
      logRevolutError("api.request_failed", failure, {
        orgRef: this.options.orgRef,
        environment: this.environment,
        path,
        attempt,
      });
      throw failure;
    }

    if (response.status === 401 && attempt === 1) {
      // The token was rejected before we thought it would expire. Refresh once,
      // then try again exactly once. Never a loop.
      logRevolut("api.authentication_failed", {
        orgRef: this.options.orgRef,
        environment: this.environment,
        path,
        status: 401,
        attempt,
      });
      await invalidateAccessToken(this.options.pool, {
        orgRef: this.options.orgRef,
        environment: this.environment,
      }).catch(() => undefined);
      return this.send<T>(path, query, attempt + 1);
    }

    if (!response.ok) {
      const failure = new RevolutError(
        categoryFromStatus(response.status),
        "Revolut avvisade anropet.",
        { status: response.status },
      );
      logRevolutError("api.request_failed", failure, {
        orgRef: this.options.orgRef,
        environment: this.environment,
        path,
        attempt,
      });
      await markTransientError(this.options.pool, {
        orgRef: this.options.orgRef,
        environment: this.environment,
        errorCode: failure.category,
      }).catch(() => undefined);
      throw failure;
    }

    let body: T;
    try {
      body = (await response.json()) as T;
    } catch (error) {
      throw new RevolutError("malformed_response", "Revolut svarade utan giltig JSON.", {
        status: response.status,
        cause: error,
      });
    }

    await markSuccess(this.options.pool, {
      orgRef: this.options.orgRef,
      environment: this.environment,
    }).catch(() => undefined);

    return body;
  }

  accounts(): Promise<RevolutAccount[]> {
    return this.get<RevolutAccount[]>("/accounts");
  }

  transactions(range: { from: Date; to: Date; count?: number }): Promise<RevolutTransaction[]> {
    return this.get<RevolutTransaction[]>("/transactions", {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      count: String(range.count ?? 1000),
    });
  }
}

export { ReauthorizationRequired };
