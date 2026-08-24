/**
 * The Revolut connection against a live Postgres, with Revolut itself mocked.
 *
 * This is where the claims in the PR are actually proven: codes are exchanged,
 * credentials land encrypted, an expired token refreshes itself, a rotated
 * refresh token replaces the old one, two instances refreshing at once produce
 * exactly one refresh, a 401 buys exactly one retry, and a dead grant is the
 * only thing that asks a human for anything.
 */

import { generateKeyPairSync } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { RevolutClient } from "./client.ts";
import {
  consumeOAuthState,
  createOAuthState,
  disconnect,
  invalidateAccessToken,
  markActionRequired,
  persistTokens,
  readConnection,
  type TokenSet,
} from "./connection.ts";
import { RevolutError } from "./errors.ts";
import { revolutHealth, warnOnCertificateExpiry } from "./health.ts";
import {
  exchangeAuthorizationCode,
  getValidAccessToken,
  ReauthorizationRequired,
  requestRefresh,
  REFRESH_MARGIN_MS,
} from "./tokens.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

const REDIRECT = "https://kansli.vercel.app/api/integrations/revolut/callback";

function futureTokens(overrides: Partial<TokenSet> = {}): TokenSet {
  return {
    accessToken: "at_live_value",
    refreshToken: "rt_live_value",
    expiresAt: new Date(Date.now() + 40 * 60_000),
    scopes: ["READ"],
    ...overrides,
  };
}

live("revolut connection (live Postgres, mocked Revolut)", () => {
  const pool = createPool(APP!, { applicationName: "revolut-test", max: 4 });
  const events = new EventLog(pool);
  let orgRef = "";

  beforeAll(async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    process.env.EKONOMI_WRAP_KEY = "revolut-test-wrap-key-0123456789";
    process.env.REVOLUT_ENVIRONMENT = "sandbox";
    process.env.REVOLUT_CLIENT_ID = "test-client-id";
    process.env.REVOLUT_PRIVATE_KEY = pair.privateKey;
    process.env.REVOLUT_REDIRECT_URI = REDIRECT;
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(() => {
    orgRef = `pixdrift:org:revolut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    vi.restoreAllMocks();
  });

  // --- OAuth state ---------------------------------------------------------

  it("accepts its own state exactly once", async () => {
    const state = await createOAuthState(pool, {
      orgRef,
      environment: "sandbox",
      actorRef: "user-1",
      redirectUri: REDIRECT,
    });
    const first = await consumeOAuthState(pool, state);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.state.orgRef).toBe(orgRef);
      expect(first.state.redirectUri).toBe(REDIRECT);
    }
    const replay = await consumeOAuthState(pool, state);
    expect(replay).toEqual({ ok: false, reason: "state_replayed" });
  });

  it("rejects an unknown state and an expired state", async () => {
    expect(await consumeOAuthState(pool, "not-a-state")).toEqual({
      ok: false,
      reason: "state_invalid",
    });
    expect(await consumeOAuthState(pool, "")).toEqual({ ok: false, reason: "state_invalid" });

    const stale = await createOAuthState(pool, {
      orgRef,
      environment: "sandbox",
      actorRef: "user-1",
      redirectUri: REDIRECT,
      ttlMs: -1000,
    });
    expect(await consumeOAuthState(pool, stale)).toEqual({ ok: false, reason: "state_expired" });
  });

  // --- authorization code exchange ----------------------------------------

  it("exchanges an authorization code with a private_key_jwt assertion", async () => {
    let seen: URLSearchParams | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      seen = new URLSearchParams(String((init as RequestInit).body));
      return new Response(
        JSON.stringify({
          access_token: "at_from_code",
          refresh_token: "rt_from_code",
          token_type: "bearer",
          expires_in: 2400,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });

    const tokens = await exchangeAuthorizationCode("code-123");
    expect(tokens.accessToken).toBe("at_from_code");
    expect(tokens.refreshToken).toBe("rt_from_code");
    // 40 minutes, as Revolut documents.
    expect(tokens.expiresAt.getTime() - Date.now()).toBeGreaterThan(39 * 60_000);

    const body = seen as unknown as URLSearchParams;
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("code-123");
    expect(body.get("client_id")).toBe("test-client-id");
    expect(body.get("redirect_uri")).toBe(REDIRECT);
    expect(body.get("client_assertion_type")).toBe(
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    );
    expect(body.get("client_assertion")?.split(".")).toHaveLength(3);
  });

  it("stores the credentials encrypted, never in plaintext", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens(),
      actorRef: "user-1",
      markConnected: true,
    });

    const { rows } = await pool.query<{
      encrypted_access_token: string;
      encrypted_refresh_token: string;
    }>(
      `select encrypted_access_token, encrypted_refresh_token
         from ekonomi.integration_connections where org_ref = $1`,
      [orgRef],
    );
    const raw = JSON.stringify(rows[0]);
    expect(raw).not.toContain("at_live_value");
    expect(raw).not.toContain("rt_live_value");

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.connection.status).toBe("active");
    expect(loaded?.connection.connectedAt).not.toBeNull();
    expect(loaded?.credentials.accessToken).toBe("at_live_value");
    expect(loaded?.credentials.refreshToken).toBe("rt_live_value");
    // The renderable half never carries token material.
    expect(JSON.stringify(loaded!.connection)).not.toContain("at_live_value");
  });

  it("classifies a rejected code without killing the connection", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid_grant" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(exchangeAuthorizationCode("stale-code")).rejects.toMatchObject({
      category: "code_rejected",
    });
  });

  // --- token lifetime -----------------------------------------------------

  it("returns the stored token untouched while it is comfortably valid", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    const refresh = vi.fn();
    const token = await getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh });
    expect(token).toBe("at_live_value");
    expect(refresh).not.toHaveBeenCalled();
  });

  it("refreshes inside the safety margin rather than at the last second", async () => {
    // Still valid, but only just — this must refresh.
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ expiresAt: new Date(Date.now() + REFRESH_MARGIN_MS - 30_000) }),
    });
    const refresh = vi.fn(async () =>
      futureTokens({ accessToken: "at_refreshed", refreshToken: null }),
    );
    const token = await getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh });
    expect(token).toBe("at_refreshed");
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("rt_live_value");

    const loaded = await readConnection(pool, orgRef, "sandbox");
    // No rotation happened, so the original refresh token must survive.
    expect(loaded?.credentials.refreshToken).toBe("rt_live_value");
    expect(loaded?.connection.lastRefreshAt).not.toBeNull();
    expect(loaded?.connection.refreshLockAt).toBeNull();
  });

  it("persists a rotated refresh token in the same transition", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ expiresAt: new Date(Date.now() - 60_000) }),
    });
    const refresh = vi.fn(async () =>
      futureTokens({ accessToken: "at_rotated", refreshToken: "rt_rotated" }),
    );
    await getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh });

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.credentials.accessToken).toBe("at_rotated");
    expect(loaded?.credentials.refreshToken).toBe("rt_rotated");
    expect(loaded?.connection.status).toBe("active");
  });

  it("lets exactly one of many concurrent callers refresh", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ expiresAt: new Date(Date.now() - 60_000) }),
    });
    let calls = 0;
    const refresh = async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 150));
      return futureTokens({ accessToken: "at_shared", refreshToken: "rt_shared" });
    };

    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh }),
      ),
    );

    expect(calls).toBe(1);
    expect(results).toEqual(["at_shared", "at_shared", "at_shared"]);
  });

  it("turns a dead refresh token into a reconnect request, once", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ expiresAt: new Date(Date.now() - 60_000) }),
    });
    const refresh = async () => {
      throw new RevolutError("refresh_rejected", "avvisad", {
        status: 400,
        providerCode: "invalid_grant",
      });
    };

    await expect(
      getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh, events }),
    ).rejects.toBeInstanceOf(ReauthorizationRequired);

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.connection.status).toBe("action_required");
    expect(loaded?.connection.lastErrorCode).toBe("invalid_grant");
    // Unusable credentials are destroyed, not left lying around.
    expect(loaded?.credentials.accessToken).toBeNull();
    expect(loaded?.credentials.refreshToken).toBeNull();

    const published = await events.list({ orgRef, order: "desc", limit: 5 });
    const kinds = published.map((event) => event.kind);
    expect(kinds).toContain("ekonomi.revolut.connection.action_required");
    expect(JSON.stringify(published)).not.toContain("rt_live_value");
  });

  it("keeps a rate-limited refresh out of the owner's way", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ expiresAt: new Date(Date.now() - 60_000) }),
    });
    const refresh = async () => {
      throw new RevolutError("rate_limited", "för många anrop", { status: 429 });
    };
    await expect(
      getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh }),
    ).rejects.toMatchObject({ category: "rate_limited" });

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.connection.status).toBe("active");
    expect(loaded?.connection.lastErrorCode).toBe("rate_limited");
    // The refresh token survives a transient failure.
    expect(loaded?.credentials.refreshToken).toBe("rt_live_value");
  });

  it("refuses to hand out a token for a connection that needs reconnecting", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    await markActionRequired(pool, {
      orgRef,
      environment: "sandbox",
      errorCode: "access_revoked",
    });
    await expect(
      getValidAccessToken({ pool, orgRef, environment: "sandbox" }),
    ).rejects.toBeInstanceOf(ReauthorizationRequired);
  });

  // --- API client ---------------------------------------------------------

  it("answers a 401 with one refresh and exactly one retry", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    const seenTokens: string[] = [];
    const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const auth = String((init?.headers as Record<string, string>)?.authorization ?? "");
      seenTokens.push(auth);
      if (seenTokens.length === 1) return new Response("{}", { status: 401 });
      return new Response(JSON.stringify([{ id: "acc-1", balance: 12.5, currency: "SEK" }]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const client = new RevolutClient({
      pool,
      orgRef,
      environment: "sandbox",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      refresh: async () => futureTokens({ accessToken: "at_after_401", refreshToken: null }),
    });

    const accounts = await client.accounts();
    expect(accounts[0]?.id).toBe("acc-1");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(seenTokens[0]).toBe("Bearer at_live_value");
    expect(seenTokens[1]).toBe("Bearer at_after_401");

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.connection.lastSuccessAt).not.toBeNull();
  });

  it("gives up after one retry instead of looping on 401", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 401 }));
    const client = new RevolutClient({
      pool,
      orgRef,
      environment: "sandbox",
      fetchImpl: fetchImpl as unknown as typeof fetch,
      refresh: async () => futureTokens({ accessToken: "at_still_bad", refreshToken: null }),
    });

    await expect(client.accounts()).rejects.toMatchObject({
      category: "authentication_expired",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("classifies 429 and 5xx without touching the credentials", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    for (const [status, category] of [
      [429, "rate_limited"],
      [503, "server_error"],
      [403, "forbidden"],
    ] as const) {
      const client = new RevolutClient({
        pool,
        orgRef,
        environment: "sandbox",
        fetchImpl: (async () => new Response("{}", { status })) as unknown as typeof fetch,
      });
      await expect(client.accounts()).rejects.toMatchObject({ category });
    }
    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.credentials.accessToken).toBe("at_live_value");
  });

  it("does not hide a malformed Revolut response", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    const client = new RevolutClient({
      pool,
      orgRef,
      environment: "sandbox",
      fetchImpl: (async () =>
        new Response("<html>nope</html>", { status: 200 })) as unknown as typeof fetch,
    });
    await expect(client.accounts()).rejects.toMatchObject({ category: "malformed_response" });
  });

  it("forces a refresh once the cached expiry is no longer trusted", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    await invalidateAccessToken(pool, { orgRef, environment: "sandbox" });
    const refresh = vi.fn(async () =>
      futureTokens({ accessToken: "at_forced", refreshToken: null }),
    );
    const token = await getValidAccessToken({ pool, orgRef, environment: "sandbox", refresh });
    expect(token).toBe("at_forced");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  // --- refresh over the wire ---------------------------------------------

  it("sends grant_type=refresh_token with a fresh assertion", async () => {
    let seen: URLSearchParams | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      seen = new URLSearchParams(String((init as RequestInit).body));
      return new Response(
        JSON.stringify({ access_token: "at_wire", expires_in: 2400, token_type: "bearer" }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    });
    const tokens = await requestRefresh("rt_on_the_wire");
    expect(tokens.accessToken).toBe("at_wire");
    expect(tokens.refreshToken).toBeNull();
    const body = seen as unknown as URLSearchParams;
    expect(body.get("grant_type")).toBe("refresh_token");
    expect(body.get("refresh_token")).toBe("rt_on_the_wire");
    expect(body.get("client_assertion")?.split(".")).toHaveLength(3);
  });

  // --- health and disconnect ---------------------------------------------

  it("reports a healthy connection without mentioning tokens", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens(),
      actorRef: "user-1",
      markConnected: true,
    });
    const health = await revolutHealth(pool, orgRef, {
      env: {
        REVOLUT_ENVIRONMENT: "sandbox",
        REVOLUT_CLIENT_ID: "test-client-id",
        REVOLUT_PRIVATE_KEY: process.env.REVOLUT_PRIVATE_KEY,
        REVOLUT_REDIRECT_URI: REDIRECT,
        REVOLUT_CERTIFICATE_EXPIRES_AT: new Date(Date.now() + 400 * 86_400_000).toISOString(),
      },
    });
    expect(health.status).toBe("active");
    expect(health.oauthConnected).toBe(true);
    expect(health.accessTokenValid).toBe(true);
    expect(health.automaticRenewal).toBe(true);
    expect(health.actionRequired).toBe(false);
    expect(health.certificate.health).toBe("valid");
    expect(health.summary).toContain("Ansluten");
    expect(JSON.stringify(health)).not.toContain("at_live_value");
    expect(JSON.stringify(health)).not.toContain("BEGIN PRIVATE KEY");
  });

  it("warns about an expiring certificate once a day, not on every read", async () => {
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    const env = {
      REVOLUT_ENVIRONMENT: "sandbox",
      REVOLUT_CLIENT_ID: "test-client-id",
      REVOLUT_PRIVATE_KEY: process.env.REVOLUT_PRIVATE_KEY,
      REVOLUT_REDIRECT_URI: REDIRECT,
      REVOLUT_CERTIFICATE_EXPIRES_AT: new Date(Date.now() + 10 * 86_400_000).toISOString(),
    };
    const health = await revolutHealth(pool, orgRef, { env });
    expect(health.certificate.health).toBe("expiring");
    expect(await warnOnCertificateExpiry(events, orgRef, health)).toBe(true);
    expect(await warnOnCertificateExpiry(events, orgRef, health)).toBe(false);
  });

  it("destroys the credentials on disconnect", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens(),
      markConnected: true,
    });
    await disconnect(pool, { orgRef, environment: "sandbox", actorRef: "user-1" });

    const loaded = await readConnection(pool, orgRef, "sandbox");
    expect(loaded?.connection.status).toBe("revoked");
    expect(loaded?.connection.lastErrorCode).toBe("disconnected_by_owner");
    expect(loaded?.credentials.accessToken).toBeNull();
    expect(loaded?.credentials.refreshToken).toBeNull();
    // Audit metadata survives the destruction.
    expect(loaded?.connection.connectedAt).not.toBeNull();

    await expect(
      getValidAccessToken({ pool, orgRef, environment: "sandbox" }),
    ).rejects.toBeInstanceOf(ReauthorizationRequired);
  });

  it("keeps sandbox and production credentials in separate rows", async () => {
    await persistTokens(pool, {
      orgRef,
      environment: "sandbox",
      tokens: futureTokens({ accessToken: "at_sandbox" }),
    });
    await persistTokens(pool, {
      orgRef,
      environment: "production",
      tokens: futureTokens({ accessToken: "at_production" }),
    });
    const sandbox = await readConnection(pool, orgRef, "sandbox");
    const production = await readConnection(pool, orgRef, "production");
    expect(sandbox?.credentials.accessToken).toBe("at_sandbox");
    expect(production?.credentials.accessToken).toBe("at_production");
    expect(sandbox?.connection.id).not.toBe(production?.connection.id);
  });

  it("never lets one tenant read another tenant's connection", async () => {
    const other = `${orgRef}-other`;
    await persistTokens(pool, { orgRef, environment: "sandbox", tokens: futureTokens() });
    expect(await readConnection(pool, other, "sandbox")).toBeNull();
    await expect(
      getValidAccessToken({ pool, orgRef: other, environment: "sandbox" }),
    ).rejects.toBeInstanceOf(ReauthorizationRequired);
  });
});
