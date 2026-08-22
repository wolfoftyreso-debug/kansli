import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import type { FastifyInstance } from "fastify";
import { createIdentityServer, generateSigningKey, seededStore, sha256Base64ForSecret } from "@pixdrift/identity";
import pkg from "../pixdrift-oidc.js";

const { createPixdriftOidc } = pkg as {
  createPixdriftOidc: (config: {
    issuer: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    fetchImpl?: typeof fetch;
  }) => {
    beginLogin(): Promise<{ authorizationUrl: string; state: string; nonce: string; codeVerifier: string }>;
    completeLogin(
      params: { code?: string; state?: string },
      expected: { state: string; nonce: string; codeVerifier: string },
    ): Promise<{ sub: string; email: string; name: string; org: { ref: string; tier: string } | null; tier: string; memberships: unknown[] }>;
  };
};

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

const CLIENT_ID = "britt-web";
const CLIENT_SECRET = "britt-secret";
const REDIRECT_URI = "http://127.0.0.1:9/auth/pixdrift/callback";

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
        audiences: ["britt-api"],
        name: "BRITT",
      },
    ],
    sessionSecret: "britt-idp-test-session-secret-at-least-32",
    cookieSecure: false,
  });
  await app.listen({ port, host: "127.0.0.1" });
});

afterAll(async () => {
  await app?.close();
});

function client() {
  return createPixdriftOidc({
    issuer,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: REDIRECT_URI,
    fetchImpl: fetch,
  });
}

async function driveLogin(authorizationUrl: string): Promise<string> {
  const form = new URLSearchParams();
  for (const [k, v] of new URL(authorizationUrl).searchParams) form.set(k, v);
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

describe("BRITT zero-dependency OIDC BFF adapter", () => {
  it("logs in via Pixdrift and returns a verified identity with tier", async () => {
    const oidc = client();
    const begin = await oidc.beginLogin();
    expect(begin.authorizationUrl.startsWith(`${issuer}/authorize`)).toBe(true);
    const code = await driveLogin(begin.authorizationUrl);

    const identity = await oidc.completeLogin(
      { code, state: begin.state },
      { state: begin.state, nonce: begin.nonce, codeVerifier: begin.codeVerifier },
    );
    expect(identity.sub).toBe("pixdrift:user:user-demo");
    expect(identity.email).toBe("demo@exempelbolaget.se");
    expect(identity.org?.ref).toBe("pixdrift:org:org-exempelbolaget");
    expect(identity.tier).toBe("enterprise");
    expect(identity.memberships).toHaveLength(2);
  });

  it("rejects a callback whose state does not match", async () => {
    const oidc = client();
    const begin = await oidc.beginLogin();
    const code = await driveLogin(begin.authorizationUrl);
    await expect(
      oidc.completeLogin(
        { code, state: "tampered" },
        { state: begin.state, nonce: begin.nonce, codeVerifier: begin.codeVerifier },
      ),
    ).rejects.toThrow(/state/);
  });

  it("rejects a tampered id token signature path (wrong verifier state)", async () => {
    const oidc = client();
    const begin = await oidc.beginLogin();
    const code = await driveLogin(begin.authorizationUrl);
    // Reusing a fresh verifier with a mismatched code_verifier fails PKCE at token exchange.
    await expect(
      oidc.completeLogin(
        { code, state: begin.state },
        { state: begin.state, nonce: begin.nonce, codeVerifier: "wrong-verifier" },
      ),
    ).rejects.toThrow();
  });
});
