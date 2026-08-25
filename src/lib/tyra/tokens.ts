import { createHash, randomBytes } from "node:crypto";

export function generateOpaqueToken(bytes = 24): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashTyraToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function tyraHubPath(token: string): string {
  return `/tyra/hub/${token}`;
}
