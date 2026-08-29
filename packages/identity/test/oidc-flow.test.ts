import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import type { FastifyInstance } from "fastify";
import {
  createOidcClient,
  createAccessTokenVerifier,
  generateCodeVerifier,
  randomValue,
} from "@pixdrift/auth-client";
import { createIdentityServer } from "../src/server.ts";
import { generateSigningKey } from "../src/keys.ts";
import { seededStore } from "../src/store.ts";
import { sha256Base64ForSecret } from "../src/secret.ts";

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

const CLIENT_ID = "test-web";
const CLIENT_SECRET = "test-secret-value";
const REDIRECT_URI = "http://127.0.0.1:9/cb";

let app: FastifyInstance;
let issuer: string;

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
      {
        clientId: CLIENT_ID,
        clientSecretHash: sha256Base64ForSecret(CLIENT_SECRET),
        redirectUris: [REDIRECT_URI],
        postLogoutRedirectUris: ["http://127.0.0.1:9/after-logout"],
        audiences: [CLIENT_ID, "alva-plattform", "rita-api"],
        name: "Test web",
      },
    ],
    sessionSecret: "test-session-secret-at-least-32-chars-long",
    cookieSecure: false,
  });
  await app.listen({ port, host: "127.0.0.1" });
});

afterAll(async () => {
  await app?.close();
});

function client() {
  return createOidcClient({
    issuer,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    fetchImpl: fetch,
  });
}

/** Drives the HTML login form and returns the redirect Location (with ?code). */
async function login(
  authorizeUrl: string,
  email: string,
  password: string,
): Promise<{
  status: number;
  location: string | null;
  setCookie: string | null;
  bodyHadForm: boolean;
}> {
  const url = new URL(authorizeUrl);
  const form = new URLSearchParams();
  for (const [k, v] of url.searchParams) form.set(k, v);
  form.set("email", email);
  form.set("password", password);
  const res = await fetch(`${issuer}/authorize`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
  });
  const body = res.status === 200 ? await res.text() : "";
  return {
    status: res.status,
    location: res.headers.get("location"),
    setCookie: res.headers.get("set-cookie"),
    bodyHadForm: body.includes('name="password"'),
  };
}

describe("leftover Identity HTML cache", () => {
  it("does not store leftover authorize or leftover logout HTML", async () => {
    const error = await fetch(`${issuer}/authorize`);
    expect(error.status).toBe(400);
    expect(error.headers.get("cache-control")).toBe("no-store");
    const logout = await fetch(`${issuer}/logout`);
    expect(logout.status).toBe(200);
    expect(logout.headers.get("cache-control")).toBe("no-store");
  });
});

describe("OIDC discovery + JWKS", () => {
  it("publishes a discovery document and a signing key", async () => {
    const disc = (await (await fetch(`${issuer}/.well-known/openid-configuration`)).json()) as {
      issuer: string;
      code_challenge_methods_supported: string[];
    };
    expect(disc.issuer).toBe(issuer);
    expect(disc.code_challenge_methods_supported).toContain("S256");
    const jwks = (await (await fetch(`${issuer}/jwks.json`)).json()) as {
      keys: Array<Record<string, unknown>>;
    };
    expect(jwks.keys).toHaveLength(1);
    expect(jwks.keys[0]).toMatchObject({ kty: "EC", crv: "P-256", use: "sig", alg: "ES256" });
    expect(jwks.keys[0].d).toBeUndefined(); // private component never exposed
  });
});

describe("Authorization Code + PKCE flow", () => {
  it("logs in, exchanges a code, and returns contract-shaped claims", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const state = randomValue();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state, nonce, codeVerifier });

    const result = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    expect(result.status).toBe(302);
    expect(result.location).toBeTruthy();
    const back = new URL(result.location!);
    expect(back.searchParams.get("state")).toBe(state);
    const code = back.searchParams.get("code");
    expect(code).toBeTruthy();

    const tokens = await oidc.exchangeCode({ code: code!, codeVerifier, nonce });
    expect(tokens.claims.email).toBe("demo@exempelbolaget.se");
    expect(tokens.claims.sub).toBe("pixdrift:user:user-demo");
    expect(tokens.claims.org?.name).toBe("Exempelbolaget AB");
    expect(tokens.claims.org?.permissions).toContain("scan:read");
    expect(tokens.claims.org?.permissions).toContain("invoice:approve");
    // Cross-org identity: the demo user advises two organisations.
    expect(tokens.claims.memberships).toHaveLength(2);

    const userinfo = await oidc.fetchUserinfo(tokens.accessToken);
    expect(userinfo.sub).toBe("pixdrift:user:user-demo");
    expect(userinfo.email).toBe("demo@exempelbolaget.se");
  });

  it("rejects a wrong password without redirecting", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const authUrl = await oidc.authorizationUrl({
      state: randomValue(),
      nonce: randomValue(),
      codeVerifier,
    });
    const result = await login(authUrl, "demo@exempelbolaget.se", "fel-losenord");
    expect(result.status).toBe(200);
    expect(result.location).toBeNull();
    expect(result.bodyHadForm).toBe(true);
  });

  it("rejects code exchange with a mismatched PKCE verifier", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const result = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    const code = new URL(result.location!).searchParams.get("code")!;
    await expect(
      oidc.exchangeCode({ code, codeVerifier: generateCodeVerifier(), nonce }),
    ).rejects.toThrow(/Token exchange failed/);
  });

  it("does not allow an authorization code to be used twice", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const result = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    const code = new URL(result.location!).searchParams.get("code")!;
    await oidc.exchangeCode({ code, codeVerifier, nonce });
    await expect(oidc.exchangeCode({ code, codeVerifier, nonce })).rejects.toThrow();
  });
});

describe("Resource-server access-token verification (ALVA/RITA adapter)", () => {
  it("verifies the access token against JWKS and enforces permissions", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const result = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    const code = new URL(result.location!).searchParams.get("code")!;
    const tokens = await oidc.exchangeCode({ code, codeVerifier, nonce });

    const verifier = createAccessTokenVerifier({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "alva-plattform",
    });
    const verified = await verifier.verify(tokens.accessToken);
    expect(verified.claims.sub).toBe("pixdrift:user:user-demo");
    expect(verified.can("scan:read")).toBe(true);
    expect(verified.can("invoice:approve")).toBe(true);
    expect(verified.can("nonsense:action")).toBe(false);

    // A token minted for these audiences must be rejected by a server that
    // expects a different audience.
    const wrongAudience = createAccessTokenVerifier({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "some-other-service",
    });
    await expect(wrongAudience.verify(tokens.accessToken)).rejects.toThrow();
  });
});

describe("Single sign-on across clients", () => {
  it("skips the login form when an IdP session cookie is present", async () => {
    const oidc = client();
    const codeVerifier = generateCodeVerifier();
    const nonce = randomValue();
    const authUrl = await oidc.authorizationUrl({ state: randomValue(), nonce, codeVerifier });
    const first = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    expect(first.setCookie).toBeTruthy();
    const cookie = first.setCookie!.split(";")[0];

    // A fresh authorize request carrying the session cookie must issue a code
    // without showing the login page.
    const secondAuthUrl = await oidc.authorizationUrl({
      state: randomValue(),
      nonce: randomValue(),
      codeVerifier: generateCodeVerifier(),
    });
    const res = await fetch(secondAuthUrl, { headers: { cookie }, redirect: "manual" });
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location")!).searchParams.get("code")).toBeTruthy();
  });
});

describe("RP-initiated logout", () => {
  it("clears the SSO session cookie on both GET and POST", async () => {
    const oidc = client();
    const authUrl = await oidc.authorizationUrl({
      state: randomValue(),
      nonce: randomValue(),
      codeVerifier: generateCodeVerifier(),
    });
    const loggedIn = await login(authUrl, "demo@exempelbolaget.se", "demo-losenord-1234");
    const cookie = loggedIn.setCookie!.split(";")[0];

    for (const method of ["GET", "POST"] as const) {
      const out = await fetch(`${issuer}/logout`, {
        method,
        headers: { cookie },
        redirect: "manual",
      });
      expect(out.status).toBeLessThan(400); // not 404/405: both methods handled
      const setCookie = out.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("pixdrift_idp=");
      expect(setCookie.toLowerCase()).toMatch(/max-age=0|expires=/);
    }
  });
});

describe("Logout open-redirect guard", () => {
  it("redirects only to a URI registered for the named client", async () => {
    const registered = "http://127.0.0.1:9/after-logout";
    const ok = await fetch(
      `${issuer}/logout?client_id=${CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(registered)}`,
      { redirect: "manual" },
    );
    expect(ok.status).toBe(302);
    expect(ok.headers.get("location")).toBe(registered);
  });

  it("ignores an unregistered target (no open redirect)", async () => {
    const evil = "https://evil.example/phish";
    const res = await fetch(
      `${issuer}/logout?client_id=${CLIENT_ID}&post_logout_redirect_uri=${encodeURIComponent(evil)}`,
      { redirect: "manual" },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("ignores a target with no client_id", async () => {
    const registered = "http://127.0.0.1:9/after-logout";
    const res = await fetch(
      `${issuer}/logout?post_logout_redirect_uri=${encodeURIComponent(registered)}`,
      { redirect: "manual" },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("Authorize leftover-error language", () => {
  it("returns English-canonical client and redirect errors without signing in", async () => {
    const unknown = await fetch(
      `${issuer}/authorize?client_id=nope&redirect_uri=http://127.0.0.1:9/cb`,
    );
    expect(unknown.status).toBe(400);
    expect(await unknown.text()).toContain("unknown client_id");

    const mismatch = await fetch(
      `${issuer}/authorize?client_id=${CLIENT_ID}&redirect_uri=http://evil.test/cb`,
    );
    expect(mismatch.status).toBe(400);
    expect(await mismatch.text()).toContain("redirect_uri does not match");

    const logout = await fetch(`${issuer}/logout`);
    expect(logout.status).toBe(200);
    const logoutHtml = await logout.text();
    expect(logoutHtml).toContain("<title>You are signed out.</title>");
    expect(logoutHtml).toContain("<p>You are signed out.</p>");
  });
});

describe("Login brute-force throttle", () => {
  it("blocks after repeated failed logins", async () => {
    const oidc = client();
    const authUrl = await oidc.authorizationUrl({
      state: randomValue(),
      nonce: randomValue(),
      codeVerifier: generateCodeVerifier(),
    });
    const badEmail = "brute@exempelbolaget.se";
    let last = 200;
    for (let i = 0; i < 12; i++) {
      const form = new URLSearchParams();
      for (const [k, v] of new URL(authUrl).searchParams) form.set(k, v);
      form.set("email", badEmail);
      form.set("password", "fel");
      const res = await fetch(`${issuer}/authorize`, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: form,
        redirect: "manual",
      });
      last = res.status;
    }
    expect(last).toBe(429);
  });
});
