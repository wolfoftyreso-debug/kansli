/**
 * Structured operational logging for the Revolut integration.
 *
 * Everything goes through `logRevolut` so there is exactly one place that can
 * leak a secret — and it redacts. Token refreshes are logged here rather than
 * published to platform.events: a routine refresh is machine noise, not a
 * business event for the family inbox.
 */

import { RevolutError, type RevolutErrorCategory } from "./errors.ts";

export type RevolutOperation =
  | "oauth.started"
  | "oauth.completed"
  | "oauth.failed"
  | "token.exchanged"
  | "token.refreshed"
  | "token.refresh_failed"
  | "token.refresh_skipped"
  | "connection.action_required"
  | "connection.disconnected"
  | "api.request_failed"
  | "api.authentication_failed"
  | "certificate.expiry_warning";

/**
 * Substrings that must never appear in a log line, whatever the caller passes.
 * Kept lowercase because the comparison lowercases the value.
 */
const FORBIDDEN = [
  "access_token",
  "refresh_token",
  "client_assertion",
  "authorization_code",
  "private_key",
  "begin private key",
  "begin rsa private key",
  "begin certificate",
  "authorization:",
  "bearer ",
];

export interface RevolutLogFields {
  orgRef?: string | null;
  connectionId?: string | null;
  environment?: string | null;
  requestId?: string | null;
  category?: RevolutErrorCategory | null;
  status?: number | null;
  providerCode?: string | null;
  path?: string | null;
  attempt?: number | null;
  expiresInSeconds?: number | null;
  rotatedRefreshToken?: boolean | null;
  daysUntilExpiry?: number | null;
}

function scrub(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const lower = value.toLowerCase();
  return FORBIDDEN.some((needle) => lower.includes(needle)) ? "[redacted]" : value;
}

export function safeFields(fields: RevolutLogFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    out[key] = scrub(value);
  }
  return out;
}

export function logRevolut(operation: RevolutOperation, fields: RevolutLogFields = {}): void {
  const line = {
    event: `revolut.${operation}`,
    ...safeFields(fields),
  };
  // Errors go to stderr so platform log routing can alert on them.
  const stream = operation.endsWith("failed") || operation.endsWith("required") ? "error" : "info";
  if (stream === "error") console.error(JSON.stringify(line));
  else console.info(JSON.stringify(line));
}

export function logRevolutError(
  operation: RevolutOperation,
  error: unknown,
  fields: RevolutLogFields = {},
): void {
  const known = error instanceof RevolutError ? error : null;
  logRevolut(operation, {
    ...fields,
    category: known?.category ?? "unknown",
    status: known?.status ?? null,
    providerCode: known?.providerCode ?? null,
  });
}
