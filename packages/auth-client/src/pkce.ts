import { createHash, randomBytes } from "node:crypto";

/** A high-entropy PKCE code verifier (RFC 7636). */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

/** The S256 challenge for a verifier. */
export function codeChallengeS256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/** Opaque, URL-safe random value for `state` and `nonce`. */
export function randomValue(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}
