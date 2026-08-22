import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createServer } from "node:net";
import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import { createIdentityServer, generateSigningKey, seededStore, sha256Base64ForSecret } from "@pixdrift/identity";
import { registerPixdriftOidc, type PixdriftIdentity } from "../src/pixdrift-oidc.ts";

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

const CLIENT_ID = "rita-web";
const CLIENT_SECRET = "rita-secret";

let idp: FastifyInstance;
let rita: FastifyInstance;
let issuer: string;
let appBase: string;
let captured: PixdriftIdentity | null = null;

beforeAll(async () => {
  const idpPort = await freePort();
  const appPort = await freePort();
  issuer = `http://127.0.0.1:${idpPort}`;
  appBase = `http://127.0.0.1:${appPort}`;
  const redirectUri = `${appBase}/auth/pixdrift/callback`;

  const { store } = await seededStore();
  const signingKey = await generateSigningKey();
  idp = await createIdentityServer({
    issuer,
    store,
    signingKey,
    clients: [
      {
        clientId: CLIENT_ID,
        clientSecretHash: sha256Base64ForSecret(CLIENT_SECRET),
        redirectUris: [redirectUri],
        audiences: ["rita-api"],
        name: "RITA",
      },
    ],
    sessionSecret: "rita-idp-test-session-secret-at-least-32",
    cookieSecure: false,
  });
  await idp.listen({ port: idpPort, host: "127.0.0.1" });

  rita = Fastify();
  await rita.register(cookie, { secret: "rita-cookie-secret-at-least-32-characters" });
  await registerPixdriftOidc(rita, {
    issuer,
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri,
    cookieSecure: false,
    fetchImpl: fetch,
    async onLogin(identity, reply) {
      captured = identity;
      // RITA would persist a real session here; a marker cookie suffices for the test.
      reply.setCookie("rita_session", "session-token", { httpOnly: true, path: "/" });
      return "/";
    },
  });
  await rita.listen({ port: appPort, host: "127.0.0.1" });
});

afterAll(async () => {
  await rita?.close();
  await idp?.close();
});

describe("RITA Pixdrift OIDC plugin", () => {
  it("logs in via Pixdrift and maps identity to a RITA tenant + session", async () => {
    // 1) Start login at RITA -> redirect to IdP authorize; capture temp cookie.
    const loginRes = await fetch(`${appBase}/auth/pixdrift/login`, { redirect: "manual" });
    expect(loginRes.status).toBe(302);
    const authorizeUrl = loginRes.headers.get("location")!;
    expect(authorizeUrl.startsWith(`${issuer}/authorize`)).toBe(true);
    const tmpCookie = (loginRes.headers.get("set-cookie") ?? "").split(";")[0];
    expect(tmpCookie.startsWith("rita_pd_oidc=")).toBe(true);

    // 2) Submit credentials at the IdP -> redirect back to RITA callback with code.
    const form = new URLSearchParams();
    for (const [k, v] of new URL(authorizeUrl).searchParams) form.set(k, v);
    form.set("email", "demo@exempelbolaget.se");
    form.set("password", "demo-losenord-1234");
    const idpRes = await fetch(`${issuer}/authorize`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: form,
      redirect: "manual",
    });
    const callbackUrl = idpRes.headers.get("location")!;
    expect(callbackUrl.startsWith(`${appBase}/auth/pixdrift/callback`)).toBe(true);

    // 3) Hit the RITA callback carrying the temp cookie.
    const cbRes = await fetch(callbackUrl, { headers: { cookie: tmpCookie }, redirect: "manual" });
    expect(cbRes.status).toBe(302);
    expect(cbRes.headers.get("location")).toBe("/");
    expect(cbRes.headers.get("set-cookie") ?? "").toContain("rita_session=");

    // 4) RITA received a verified identity mapped to a tenant.
    expect(captured).not.toBeNull();
    expect(captured!.sub).toBe("pixdrift:user:user-demo");
    expect(captured!.email).toBe("demo@exempelbolaget.se");
    expect(captured!.tenantId).toBe("org-exempelbolaget");
    expect(captured!.org?.permissions).toContain("scan:read");
    expect(captured!.memberships).toHaveLength(2);
  });

  it("rejects a callback without the temporary state cookie", async () => {
    const res = await fetch(`${appBase}/auth/pixdrift/callback?code=x&state=y`, { redirect: "manual" });
    expect(res.status).toBe(400);
  });
});
