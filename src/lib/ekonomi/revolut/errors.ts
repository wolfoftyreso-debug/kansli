/**
 * Error classification for Revolut calls.
 *
 * The point of this module is one decision: does this failure mean the owner
 * must reauthorise in Revolut, or is it noise we retry or simply report? A
 * normal expired access token must never reach the owner as "action required".
 */

export type RevolutErrorCategory =
  | "configuration"
  | "state_invalid"
  | "state_expired"
  | "state_replayed"
  | "authorization_denied"
  | "code_rejected"
  | "assertion_rejected"
  | "authentication_expired"
  | "refresh_rejected"
  | "forbidden"
  | "rate_limited"
  | "server_error"
  | "timeout"
  | "network"
  | "malformed_response"
  | "unknown";

export class RevolutError extends Error {
  readonly category: RevolutErrorCategory;
  readonly status: number | null;
  /** Revolut's own error code, when it sent one. Never the description body. */
  readonly providerCode: string | null;

  constructor(
    category: RevolutErrorCategory,
    message: string,
    options: { status?: number | null; providerCode?: string | null; cause?: unknown } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "RevolutError";
    this.category = category;
    this.status = options.status ?? null;
    this.providerCode = options.providerCode ?? null;
  }
}

/** These mean the grant is gone. Only these ask a human to reconnect. */
const PERMANENT: ReadonlySet<RevolutErrorCategory> = new Set([
  "refresh_rejected",
  "authorization_denied",
]);

/** Worth one more attempt later. Never a reason to bother the owner. */
const TRANSIENT: ReadonlySet<RevolutErrorCategory> = new Set([
  "rate_limited",
  "server_error",
  "timeout",
  "network",
]);

export function requiresReauthorization(error: unknown): boolean {
  return error instanceof RevolutError && PERMANENT.has(error.category);
}

export function isTransient(error: unknown): boolean {
  return error instanceof RevolutError && TRANSIENT.has(error.category);
}

/** True when a fresh access token is worth trying once before giving up. */
export function isAuthenticationFailure(error: unknown): boolean {
  return error instanceof RevolutError && error.category === "authentication_expired";
}

export function categoryFromStatus(status: number): RevolutErrorCategory {
  if (status === 401) return "authentication_expired";
  if (status === 403) return "forbidden";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  return "unknown";
}

/**
 * OAuth token-endpoint failures. Revolut answers with an OAuth error code, and
 * `invalid_grant` on a refresh means the refresh token is dead for good.
 */
export function tokenErrorCategory(
  status: number,
  providerCode: string | null,
  grant: "authorization_code" | "refresh_token",
): RevolutErrorCategory {
  const code = providerCode?.toLowerCase() ?? null;
  if (code === "invalid_client" || code === "invalid_request") return "assertion_rejected";
  if (code === "access_denied") return "authorization_denied";
  if (code === "invalid_grant") {
    return grant === "refresh_token" ? "refresh_rejected" : "code_rejected";
  }
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status === 400 || status === 401) {
    return grant === "refresh_token" ? "refresh_rejected" : "code_rejected";
  }
  return "unknown";
}

export function describeCategory(category: RevolutErrorCategory): string {
  switch (category) {
    case "configuration":
      return "The Revolut configuration is not ready.";
    case "state_invalid":
      return "Something went wrong in the connection. Start again from Connect.";
    case "state_expired":
      return "The connection took too long. Start again from Connect.";
    case "state_replayed":
      return "The connection was already used. Start again from Connect.";
    case "authorization_denied":
      return "Access was denied in Revolut.";
    case "code_rejected":
      return "Revolut said no. Try connecting again.";
    case "assertion_rejected":
      return "Revolut did not recognise us. Ask operations to check the id and certificate.";
    case "authentication_expired":
      return "The connection needed to be renewed. That happens automatically.";
    case "refresh_rejected":
      return "The connection is no longer valid. Connect Revolut again.";
    case "forbidden":
      return "The connection is not allowed to do this in Revolut.";
    case "rate_limited":
      return "Revolut is receiving too many calls right now. Wait a moment.";
    case "server_error":
      return "Revolut answered with a server error.";
    case "timeout":
      return "Revolut did not answer within the time limit.";
    case "network":
      return "Network error toward Revolut.";
    case "malformed_response":
      return "Revolut answered with something we could not parse.";
    default:
      return "Unknown error toward Revolut.";
  }
}
