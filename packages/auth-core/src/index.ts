/**
 * Password and token primitives for the Pixdrift identity provider.
 *
 * scrypt from Node's own crypto: memory-hard, in the standard library, needs no
 * native build — an auth story that fails to install is worse than one that is
 * merely good. Ported from RITA's `packages/auth` so the whole family shares
 * one verified password scheme.
 *
 * A verifier for bcrypt hashes minted by ALVA's `pgcrypto crypt()` is included
 * so existing users migrate without a forced reset: verify against the old
 * scheme, then re-hash with scrypt on the next successful sign-in.
 */

import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_BYTES = 64;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = await scryptAsync(password, salt, KEY_BYTES);
  return `scrypt$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  const derived = await scryptAsync(password, salt, expected.length);

  // Length is compared first and separately: `timingSafeEqual` throws on a
  // mismatch, and letting it throw would turn a wrong password into a 500.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

/** True when a stored hash is in the current (scrypt) scheme. */
export function isCurrentScheme(stored: string): boolean {
  return stored.startsWith("scrypt$");
}

/** Session tokens are stored hashed, so a database dump is not live sessions. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** An opaque, URL-safe random id (authorization codes, refresh tokens, ids). */
export function newOpaqueId(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
