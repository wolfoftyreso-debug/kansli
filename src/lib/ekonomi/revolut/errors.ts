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
      return "Revolut-konfigurationen är inte klar.";
    case "state_invalid":
      return "Något gick fel i anslutningen. Börja om från Anslut.";
    case "state_expired":
      return "Anslutningen tog för lång tid. Börja om från Anslut.";
    case "state_replayed":
      return "Anslutningen var redan använd. Börja om från Anslut.";
    case "authorization_denied":
      return "Åtkomsten nekades i Revolut.";
    case "code_rejected":
      return "Revolut sa nej. Prova att ansluta igen.";
    case "assertion_rejected":
      return "Revolut kände inte igen oss. Be den som sköter driften kontrollera id och certifikat.";
    case "authentication_expired":
      return "Anslutningen behövde förnyas. Det sker automatiskt.";
    case "refresh_rejected":
      return "Anslutningen gäller inte längre. Anslut Revolut igen.";
    case "forbidden":
      return "Anslutningen får inte göra det här i Revolut.";
    case "rate_limited":
      return "Revolut tar emot för många anrop just nu. Vänta en stund.";
    case "server_error":
      return "Revolut svarade med ett serverfel.";
    case "timeout":
      return "Revolut svarade inte inom tidsgränsen.";
    case "network":
      return "Nätverksfel mot Revolut.";
    case "malformed_response":
      return "Revolut svarade med något vi inte kunde tolka.";
    default:
      return "Okänt fel mot Revolut.";
  }
}
