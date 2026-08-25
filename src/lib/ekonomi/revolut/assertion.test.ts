import { generateKeyPairSync } from "node:crypto";
import { decodeJwt, decodeProtectedHeader, importSPKI, jwtVerify } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { ASSERTION_ALG, ASSERTION_AUDIENCE } from "./config.ts";
import { ASSERTION_TTL_SECONDS, ASSERTION_TYPE, signClientAssertion } from "./assertion.ts";

let privateKeyPem: string;
let publicKeyPem: string;

beforeAll(() => {
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  privateKeyPem = pair.privateKey;
  publicKeyPem = pair.publicKey;
});

describe("client assertion", () => {
  it("uses the assertion type Revolut expects", () => {
    expect(ASSERTION_TYPE).toBe("urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
  });

  it("signs with PS256 only", async () => {
    const jwt = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
    });
    expect(decodeProtectedHeader(jwt).alg).toBe("PS256");
    expect(ASSERTION_ALG).toBe("PS256");
  });

  it("carries Revolut's claims: iss is the redirect host, sub the client id", async () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    const jwt = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
      now,
    });
    const claims = decodeJwt(jwt);
    expect(claims.iss).toBe("kansli.vercel.app");
    expect(claims.sub).toBe("client-abc");
    expect(claims.aud).toBe(ASSERTION_AUDIENCE);
    expect(claims.iat).toBe(Math.floor(now.getTime() / 1000));
    expect(claims.exp).toBe(Math.floor(now.getTime() / 1000) + ASSERTION_TTL_SECONDS);
    expect(typeof claims.jti).toBe("string");
  });

  it("is short-lived and unique per call", async () => {
    const first = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
    });
    const second = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
    });
    expect(decodeJwt(first).jti).not.toBe(decodeJwt(second).jti);
    const claims = decodeJwt(first);
    expect((claims.exp as number) - (claims.iat as number)).toBeLessThanOrEqual(300);
  });

  it("produces a signature the matching public key verifies", async () => {
    const jwt = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
    });
    const key = await importSPKI(publicKeyPem, "PS256");
    const { payload } = await jwtVerify(jwt, key, {
      audience: ASSERTION_AUDIENCE,
      issuer: "kansli.vercel.app",
    });
    expect(payload.sub).toBe("client-abc");
  });

  it("rejects a signature checked against a different key", async () => {
    const other = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    });
    const jwt = await signClientAssertion({
      issuer: "kansli.vercel.app",
      clientId: "client-abc",
      privateKeyPem,
    });
    const key = await importSPKI(other.publicKey, "PS256");
    await expect(jwtVerify(jwt, key)).rejects.toThrow();
  });

  it("fails loudly on a malformed key", async () => {
    await expect(
      signClientAssertion({
        issuer: "kansli.vercel.app",
        clientId: "client-abc",
        privateKeyPem: "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----\n",
      }),
    ).rejects.toThrow(/PKCS#8/);
  });

  it("refuses to sign without iss or sub", async () => {
    await expect(
      signClientAssertion({ issuer: "", clientId: "client-abc", privateKeyPem }),
    ).rejects.toThrow(/iss/);
    await expect(
      signClientAssertion({ issuer: "kansli.vercel.app", clientId: "", privateKeyPem }),
    ).rejects.toThrow(/sub/);
  });
});
