export const RISK_LEVELS = [0, 1, 2, 3, 4] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const RISK_LABEL: Record<RiskLevel, string> = {
  0: "informational",
  1: "authenticated_read",
  2: "reversible_write",
  3: "material_action",
  4: "high_risk",
};

export type RateClass = "read" | "write" | "heavy";

export function rateClassFor(level: RiskLevel): RateClass {
  if (level >= 3) return "heavy";
  if (level >= 2) return "write";
  return "read";
}

export function requiresApproval(level: RiskLevel): boolean {
  return level >= 4;
}

/** Tokens per minute, per isolate. Shared limiter, not a cluster store. */
export const RATE_BUDGET: Record<RateClass, number> = {
  read: 60,
  write: 20,
  heavy: 5,
};
