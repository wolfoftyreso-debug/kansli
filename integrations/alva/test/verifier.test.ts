import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import type { FastifyInstance } from "fastify";
import { createOidcClient, generateCodeVerifier, randomValue } from "@pixdrift/auth-client";
import {
  createIdentityServer,
  generateSigningKey,
  seededStore,
  sha256Base64ForSecret,
} from "@pixdrift/identity";
// The module under test is ALVA's zero-dependency verifier.
import { skapaPixdriftVerifierare, harBehorighet, bearerUr } from "../src/pixdrift-auth.mjs";

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

const CLIENT_ID = "alva-web";
const CLIENT_SECRET = "alva-secret";
const REDIRECT_URI = "http://127.0.0.1:9/cb";

let app: FastifyInstance;
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
      {
        clientId: CLIENT_ID,
        clientSecretHash: sha256Base64ForSecret(CLIENT_SECRET),
        redirectUris: [REDIRECT_URI],
        audiences: ["alva-plattform", "alva-ai-orkester"],
        name: "ALVA",
      },
    ],
    sessionSecret: "alva-test-session-secret-at-least-32-chars",
    cookieSecure: false,
  });
  await app.listen({ port, host: "127.0.0.1" });

  // Obtain a real access token through the full Authorization Code + PKCE flow.
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

describe("ALVA zero-dependency Pixdrift verifier", () => {
  it("verifies a real ES256 token against JWKS and exposes claims", async () => {
    const verifier = skapaPixdriftVerifierare({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "alva-plattform",
      fetchImpl: fetch,
    });
    const claims = await verifier.verifiera(bearerUr(`Bearer ${accessToken}`));
    expect(claims.sub).toBe("pixdrift:user:user-demo");
    expect(claims.iss).toBe(issuer);
    expect(harBehorighet(claims, "arende:write")).toBe(true);
    expect(harBehorighet(claims, "scan:read")).toBe(true);
    expect(harBehorighet(claims, "finding:delete")).toBe(false);
  });

  it("rejects a token for the wrong audience", async () => {
    const verifier = skapaPixdriftVerifierare({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "some-other-service",
      fetchImpl: fetch,
    });
    await expect(verifier.verifiera(accessToken)).rejects.toThrow(/audience/);
  });

  it("rejects a tampered token", async () => {
    const verifier = skapaPixdriftVerifierare({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      audience: "alva-plattform",
      fetchImpl: fetch,
    });
    const [h, p, s] = accessToken.split(".");
    // Flip a byte in the payload; signature must no longer verify.
    const tamperedPayload = Buffer.from(p, "base64url");
    tamperedPayload[0] ^= 0x01;
    const tampered = `${h}.${tamperedPayload.toString("base64url")}.${s}`;
    await expect(verifier.verifiera(tampered)).rejects.toThrow(/signatur/);
  });

  it("rejects a malformed token", async () => {
    const verifier = skapaPixdriftVerifierare({
      issuer,
      jwksUri: `${issuer}/jwks.json`,
      fetchImpl: fetch,
    });
    await expect(verifier.verifiera("not-a-jwt")).rejects.toThrow(/format/);
  });
});
