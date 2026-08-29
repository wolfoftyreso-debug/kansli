/**
 * Revolut's client-assertion JWT.
 *
 * Claims follow Revolut's Business API guide, not generic OAuth advice:
 *   iss = the host of the registered OAuth redirect URI, without scheme
 *   sub = the client id Revolut issued for the certificate
 *   aud = https://revolut.com
 *   exp = short-lived expiry
 * Signed with PS256, which is the only algorithm Revolut accepts.
 */

import { SignJWT, importPKCS8 } from "jose";
import {
  ASSERTION_ALG,
  ASSERTION_AUDIENCE,
  revolutClientId,
  revolutJwtIssuer,
  revolutPrivateKeyPem,
  type Env,
} from "./config.ts";

export const ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";

/** Long enough to survive a slow token call, short enough to be worthless if leaked. */
export const ASSERTION_TTL_SECONDS = 120;

export interface AssertionInput {
  issuer: string;
  clientId: string;
  privateKeyPem: string;
  ttlSeconds?: number;
  now?: Date;
}

export async function signClientAssertion(input: AssertionInput): Promise<string> {
  if (!input.issuer)
    throw new Error("The client assertion is missing iss (the redirect URI host).");
  if (!input.clientId) throw new Error("The client assertion is missing sub (REVOLUT_CLIENT_ID).");

  let key: CryptoKey | Uint8Array;
  try {
    key = await importPKCS8(input.privateKeyPem, ASSERTION_ALG);
  } catch {
    throw new Error("REVOLUT_PRIVATE_KEY could not be parsed as PKCS#8. Check the PEM contents.");
  }

  const issuedAt = Math.floor((input.now?.getTime() ?? Date.now()) / 1000);
  const ttl = input.ttlSeconds ?? ASSERTION_TTL_SECONDS;

  return new SignJWT({})
    .setProtectedHeader({ alg: ASSERTION_ALG, typ: "JWT" })
    .setIssuer(input.issuer)
    .setSubject(input.clientId)
    .setAudience(ASSERTION_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + ttl)
    .setJti(crypto.randomUUID())
    .sign(key);
}

/** Builds the assertion from the environment. Throws when config is incomplete. */
export async function clientAssertionFromEnv(env: Env = process.env): Promise<string> {
  const privateKeyPem = revolutPrivateKeyPem(env);
  if (!privateKeyPem) throw new Error("REVOLUT_PRIVATE_KEY is missing.");
  const clientId = revolutClientId(env);
  if (!clientId)
    throw new Error("REVOLUT_CLIENT_ID is missing. Revolut issues it after the certificate.");
  return signClientAssertion({
    issuer: revolutJwtIssuer(env),
    clientId,
    privateKeyPem,
  });
}
