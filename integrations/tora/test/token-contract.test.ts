/**
 * TORA is OIDC-native (public SPA client via PKCE + a Fastify resource server
 * that verifies tokens with jose/JWKS). Wiring is therefore configuration —
 * point TORA at the Pixdrift issuer. The risk is not code but the *token
 * contract*: TORA's `service/src/auth/verify.ts` + `principal.ts` require
 * `sub`, `tenant`, `tier` and `scope`. This test mints a real token from the
 * Pixdrift IdP for the `tora-opportunity` audience and runs TORA's exact
 * verification + principal parsing against it.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { createOidcClient, generateCodeVerifier, randomValue } from "@pixdrift/auth-client";
import { createIdentityServer, generateSigningKey, seededStore } from "@pixdrift/identity";

// --- Verbatim from TORA's platform/opportunity/service/src/auth/principal.ts ---
type Tier = "free" | "pro" | "professional" | "enterprise";
type Scope =
  | "opportunity:read"
  | "profile:read"
  | "profile:write"
  | "watchlist:read"
  | "watchlist:write";
const ALL_SCOPES: Scope[] = [
  "opportunity:read",
  "profile:read",
  "profile:write",
  "watchlist:read",
  "watchlist:write",
];
const TIERS: Tier[] = ["free", "pro", "professional", "enterprise"];
function parseTier(value: unknown): Tier {
  return typeof value === "string" && (TIERS as string[]).includes(value) ? (value as Tier) : "free";
}
function parseScopes(value: unknown): Set<Scope> {
  const raw =
    typeof value === "string"
      ? value.split(/\s+/)
      : Array.isArray(value)
        ? value.map(String)
        : [];
  return new Set(raw.filter((s): s is Scope => (ALL_SCOPES as string[]).includes(s)));
}
interface Principal {
  subject: string;
  tenantId: string;
  tier: Tier;
  scopes: Set<Scope>;
}
function principalFromClaims(claims: JWTPayload): Principal {
  const tenantId = typeof claims.tenant === "string" ? claims.tenant : undefined;
  if (!claims.sub || !tenantId) throw new Error("Token saknar sub eller tenant.");
  return {
    subject: claims.sub,
    tenantId,
    tier: parseTier(claims.tier),
    scopes: parseScopes(claims.scope ?? claims.scp),
  };
}
// --- end verbatim ---

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

const AUDIENCE = "tora-opportunity";
const REDIRECT_URI = "http://127.0.0.1:8080/opportunity";

let app: Awaited<ReturnType<typeof createIdentityServer>>;
let issuer: string;
let accessToken: string;

beforeAll(async () => {
  const port = await freePort();
  issuer = `http://127.0.0.1:${port}`;
  const { store } = await seededStore();
  const signingKey = await generateSigningKey();
  app = await createIdentityServer({
    issuer,
    store,
    signingKey,
    clients: [
      // Public SPA client: no clientSecretHash — PKCE alone protects it.
      { clientId: "tora-web", redirectUris: [REDIRECT_URI], audiences: [AUDIENCE], name: "TORA" },
    ],
    sessionSecret: "tora-test-session-secret-at-least-32-chars",
    cookieSecure: false,
  });
  await app.listen({ port, host: "127.0.0.1" });

  // A public client sends no secret; the IdP skips secret checks when the
  // client has no clientSecretHash. auth-client always sends the field, so an
  // empty secret is fine here.
  const oidc = createOidcClient({
    issuer,
    clientId: "tora-web",
    clientSecret: "",
    redirectUri: REDIRECT_URI,
    fetchImpl: fetch,
  });
  const codeVerifier = generateCodeVerifier();
  const nonce = randomValue();
  const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
  const form = new URLSearchParams();
  for (const [k, v] of new URL(authUrl).searchParams) form.set(k, v);
  form.set("email", "demo@exempelbolaget.se");
  form.set("password", "demo-losenord-1234");
  const res = await fetch(`${issuer}/authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
  });
  const code = new URL(res.headers.get("location")!).searchParams.get("code")!;
  const tokens = await oidc.exchangeCode({ code, codeVerifier, nonce });
  accessToken = tokens.accessToken;
});

afterAll(async () => {
  await app?.close();
});

describe("Pixdrift token satisfies TORA's resource-server contract", () => {
  it("verifies via JWKS and yields a valid TORA Principal", async () => {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/jwks.json`));
    const { payload } = await jwtVerify(accessToken, jwks, {
      issuer,
      audience: AUDIENCE,
      clockTolerance: 60,
    });

    const principal = principalFromClaims(payload);
    expect(principal.subject).toBe("pixdrift:user:user-demo");
    // TORA reads `tenant` as an opaque scoping id; the IdP emits the org ref.
    expect(principal.tenantId).toBe("pixdrift:org:org-exempelbolaget");
    // Entitlement rides the token, deny-by-default; the demo org is enterprise.
    expect(principal.tier).toBe("enterprise");
    // Granted scopes arrive in the standard `scope` claim.
    expect(principal.scopes.has("opportunity:read")).toBe(true);
    expect(principal.scopes.has("profile:write")).toBe(true);
    expect(principal.scopes.has("watchlist:read")).toBe(true);
  });

  it("is rejected by a resource server expecting a different audience", async () => {
    const jwks = createRemoteJWKSet(new URL(`${issuer}/jwks.json`));
    await expect(
      jwtVerify(accessToken, jwks, { issuer, audience: "some-other-service" }),
    ).rejects.toThrow();
  });
});
