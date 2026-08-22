/**
 * Signing keys for issued tokens.
 *
 * Asymmetric (ES256) so resource servers verify with a public key from the
 * JWKS and never hold a secret that could mint tokens — the upgrade away from
 * ALVA's shared HS256 secret. In production the private key lives in a KMS/HSM
 * (ALVA's `nyckelvalv`); here it is generated at startup or supplied for tests.
 */

import { exportJWK, generateKeyPair, importPKCS8, type JWK } from "jose";
import { createHash } from "node:crypto";

/** jose v6 returns web-crypto keys; derive the type from the library itself. */
export type SignPrivateKey = Awaited<ReturnType<typeof importPKCS8>>;

export interface SigningKey {
  alg: "ES256";
  kid: string;
  privateKey: SignPrivateKey;
  publicJwk: JWK;
}

function kidFor(jwk: JWK): string {
  const material = JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x, y: jwk.y });
  return createHash("sha256").update(material).digest("base64url").slice(0, 16);
}

export async function generateSigningKey(): Promise<SigningKey> {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  const kid = kidFor(publicJwk);
  publicJwk.kid = kid;
  publicJwk.alg = "ES256";
  publicJwk.use = "sig";
  return { alg: "ES256", kid, privateKey, publicJwk };
}

/** Load a signing key from a PKCS#8 PEM (e.g. pulled from KMS/Secrets Manager). */
export async function signingKeyFromPkcs8(pem: string, publicJwk: JWK): Promise<SigningKey> {
  const privateKey = await importPKCS8(pem, "ES256");
  const kid = publicJwk.kid ?? kidFor(publicJwk);
  return {
    alg: "ES256",
    kid,
    privateKey,
    publicJwk: { ...publicJwk, kid, alg: "ES256", use: "sig" },
  };
}

export function jwks(key: SigningKey): { keys: JWK[] } {
  return { keys: [key.publicJwk] };
}
