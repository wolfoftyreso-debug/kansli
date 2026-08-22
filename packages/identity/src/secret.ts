import { createHash } from "node:crypto";

/**
 * The stored form of a confidential client's secret: sha256, base64. Kept out
 * of the server module so tooling and seeds can compute it without importing
 * Fastify.
 */
export function sha256Base64ForSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("base64");
}
