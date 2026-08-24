export const IRMA_STATUSES = ["draft", "viewed", "signed", "expired", "cancelled"] as const;
export type IrmaStatus = (typeof IRMA_STATUSES)[number];

/** Only levels this nav implements. 2–5 are specified, not built. */
export type VerificationLevel = 0 | 1;

export const IRMA_TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function parseVerificationLevel(value: unknown): VerificationLevel {
  return value === 0 || value === "0" ? 0 : 1;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Skapat";
    case "viewed":
      return "Öppnat";
    case "signed":
      return "Bekräftat";
    case "expired":
      return "Utgånget";
    case "cancelled":
      return "Återkallat";
    default:
      return status;
  }
}

export function effectiveStatus(input: {
  status: string;
  tokenExpiresAt?: string | null;
  tokenRevokedAt?: string | null;
}): IrmaStatus | string {
  if (input.status === "signed" || input.status === "cancelled") return input.status;
  if (input.tokenRevokedAt) return "cancelled";
  if (input.tokenExpiresAt && Date.parse(input.tokenExpiresAt) <= Date.now()) return "expired";
  return input.status;
}

export function verificationLabel(level: VerificationLevel): string {
  return level === 0 ? "Ingen bekräftelse (informationsunderlag)" : "Hashad bekräftelse (nivå 1)";
}
