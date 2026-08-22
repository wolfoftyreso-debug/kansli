/**
 * PostgreSQL-backed IdP: full OIDC flow against the pg store, the DB-backed
 * client registry, and signing-key persistence across a simulated restart.
 *
 * Gated on real Postgres. Set both to run:
 *   PIXDRIFT_TEST_OWNER_URL=postgres://pixdrift_owner:...@host/pixdrift_idp_test
 *   PIXDRIFT_TEST_DATABASE_URL=postgres://pixdrift_app:...@host/pixdrift_idp_test
 * Skipped (green) when they are absent.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import {
  createOidcClient,
  createAccessTokenVerifier,
  generateCodeVerifier,
  randomValue,
} from "@pixdrift/auth-client";
import { createIdentityServer } from "../src/server.ts";
import { PgStore } from "../src/pg/store.ts";
import { pgBootstrap } from "../src/pg/bootstrap.ts";
import { sha256Base64ForSecret } from "../src/secret.ts";

const OWNER_URL = process.env.PIXDRIFT_TEST_OWNER_URL;
const APP_URL = process.env.PIXDRIFT_TEST_DATABASE_URL;
const run = OWNER_URL && APP_URL ? describe : describe.skip;

const CLIENT_ID = "pgtest-web";
const CLIENT_SECRET = "pgtest-secret";
const REDIRECT_URI = "http://127.0.0.1:9/cb";

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      resolve(typeof addr === "object" && addr ? addr.port : 0);
      srv.close();
    });
  });
}

async function login(issuer: string, authorizeUrl: string): Promise<string> {
  const form = new URLSearchParams();
  for (const [k, v] of new URL(authorizeUrl).searchParams) form.set(k, v);
  form.set("email", "demo@exempelbolaget.se");
  form.set("password", "demo-losenord-1234");
  const res = await fetch(`${issuer}/authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
  });
  return new URL(res.headers.get("location")!).searchParams.get("code")!;
}

run("PostgreSQL-backed IdP", () => {
  let app: Awaited<ReturnType<typeof createIdentityServer>>;
  let store: PgStore;
  let issuer: string;
  let bootKid: string;

  beforeAll(async () => {
    await pgBootstrap({
      ownerUrl: OWNER_URL as string,
      appRole: "pixdrift_app",
      clients: [
        {
          clientId: CLIENT_ID,
          clientSecretHash: sha256Base64ForSecret(CLIENT_SECRET),
          redirectUris: [REDIRECT_URI],
          audiences: [CLIENT_ID, "pgtest-api"],
          name: "PG test",
        },
      ],
      seedDemo: true,
    });

    const port = await freePort();
    issuer = `http://127.0.0.1:${port}`;
    store = new PgStore(APP_URL as string);
    const registered = await store.loadClients();
    expect(registered.some((c) => c.clientId === CLIENT_ID)).toBe(true); // DB-backed registry
    const signingKey = await store.loadActiveSigningKey();
    bootKid = signingKey.kid;
    const additionalPublicJwks = await store.otherPublicJwks(signingKey.kid);
    app = await createIdentityServer({
      issuer,
      store,
      signingKey,
      additionalPublicJwks,
      clients: registered,
      sessionSecret: "pg-test-session-secret-at-least-32-characters",
      cookieSecure: false,
    });
    await app.listen({ port, host: "127.0.0.1" });
  });

  afterAll(async () => {
    await app?.close();
    await store?.close();
  });

  it("runs the full Authorization Code + PKCE flow off Postgres", async () => {
    const oidc = createOidcClient({
      issuer,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetchImpl: fetch,
    });
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const code = await login(issuer, authUrl);
    const tokens = await oidc.exchangeCode({ code, codeVerifier, nonce });

    expect(tokens.claims.sub).toBe("pixdrift:user:user-demo");
    expect(tokens.claims.org?.name).toBe("Exempelbolaget AB");
    expect(tokens.claims.org?.tier).toBe("enterprise");
    expect(tokens.claims.memberships).toHaveLength(2);

    const verifier = createAccessTokenVerifier({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "pgtest-api",
    });
    const verified = await verifier.verify(tokens.accessToken);
    expect(verified.claims.tenant).toBe("pixdrift:org:org-exempelbolaget");
    expect(verified.claims.tier).toBe("enterprise");
    expect(verified.can("opportunity:read")).toBe(true);
  });

  it("persists the signing key across a restart (same kid, JWKS stable)", async () => {
    const reopened = new PgStore(APP_URL as string);
    try {
      const key = await reopened.loadActiveSigningKey();
      expect(key.kid).toBe(bootKid);
      const jwks = (await (await fetch(`${issuer}/jwks.json`)).json()) as {
        keys: Array<{ kid: string }>;
      };
      expect(jwks.keys.some((k) => k.kid === bootKid)).toBe(true);
    } finally {
      await reopened.close();
    }
  });

  it("keeps authorization codes single-use in Postgres", async () => {
    const oidc = createOidcClient({
      issuer,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
      fetchImpl: fetch,
    });
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const code = await login(issuer, authUrl);
    await oidc.exchangeCode({ code, codeVerifier, nonce });
    await expect(oidc.exchangeCode({ code, codeVerifier, nonce })).rejects.toThrow();
  });
});
