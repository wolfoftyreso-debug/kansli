import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import { createIdentityServer, generateSigningKey, seededStore, sha256Base64ForSecret } from "@pixdrift/identity";
import { createPixdriftOidc } from "../src/pixdrift-oidc.ts";

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

const CLIENT_ID = "irma-web";
const CLIENT_SECRET = "irma-secret";
const REDIRECT_URI = "http://127.0.0.1:9/auth/pixdrift/callback";

let app: Awaited<ReturnType<typeof createIdentityServer>>;
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
        audiences: ["irma-api"],
        name: "IRMA",
      },
    ],
    sessionSecret: "irma-idp-test-session-secret-at-least-32",
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

describe("IRMA staff OIDC BFF adapter", () => {
  it("logs a staff user in via Pixdrift and returns a verified identity", async () => {
    const oidc = client();
    const begin = await oidc.beginLogin();
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
});
