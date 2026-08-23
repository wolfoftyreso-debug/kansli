export type FindingSeverity = "low" | "medium" | "high";

export interface MetricFacts {
  period: string;
  revenue: number;
  planRevenue: number;
  cash: number;
  monthlyBurn: number;
  topCustomerShare: number;
}

export interface FindingDraft {
  fingerprint: string;
  severity: FindingSeverity;
  category: string;
  title: string;
  body: string;
  evidence: Array<{ label: string; value: string }>;
}

/** Demonstration facts for Exempelbolaget — not live bookkeeping. */
export const DEMO_METRICS: MetricFacts = {
  period: "2026-07",
  revenue: 980_000,
  planRevenue: 1_200_000,
  cash: 450_000,
  monthlyBurn: 380_000,
  topCustomerShare: 0.42,
};

const kr = (value: number) =>
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";

const pct = (value: number) => (value * 100).toFixed(1).replace(".", ",") + " %";

export function evaluateMetrics(facts: MetricFacts): FindingDraft[] {
  const drafts: FindingDraft[] = [];

  if (facts.planRevenue > 0) {
    const deviation = (facts.revenue - facts.planRevenue) / facts.planRevenue;
    if (deviation < -0.05) {
      drafts.push({
        fingerprint: "revenue_below_plan",
        severity: deviation < -0.15 ? "high" : "medium",
        category: "revenue",
        title: `Omsättningen ligger ${pct(Math.abs(deviation))} under plan`,
        body: `Omsättningen för ${facts.period} var ${kr(facts.revenue)} mot planens ${kr(facts.planRevenue)}.`,
        evidence: [
          { label: `Omsättning ${facts.period}`, value: kr(facts.revenue) },
          { label: "Månatligt omsättningsmål", value: kr(facts.planRevenue) },
          { label: "Avvikelse mot plan", value: pct(deviation) },
        ],
      });
    }
  }

  if (facts.monthlyBurn > 0) {
    const months = facts.cash / facts.monthlyBurn;
    if (months < 3) {
      drafts.push({
        fingerprint: "liquidity_runway",
        severity: months < 1.5 ? "high" : "medium",
        category: "liquidity",
        title: `Likviditeten räcker ${months.toFixed(1).replace(".", ",")} månader`,
        body: `Kassa ${kr(facts.cash)} mot månadsförbrukning ${kr(facts.monthlyBurn)}.`,
        evidence: [
          { label: "Kassa", value: kr(facts.cash) },
          { label: "Månadsförbrukning", value: kr(facts.monthlyBurn) },
          { label: "Runway", value: `${months.toFixed(1).replace(".", ",")} mån` },
        ],
      });
    }
  }

  if (facts.topCustomerShare >= 0.35) {
    drafts.push({
      fingerprint: "customer_concentration",
      severity: facts.topCustomerShare >= 0.5 ? "high" : "medium",
      category: "concentration",
      title: `Största kunden står för ${pct(facts.topCustomerShare)} av intäkten`,
      body: "Koncentrationen är hög nog att en förlorad kund syns i kassan samma kvartal.",
      evidence: [{ label: "Andel största kund", value: pct(facts.topCustomerShare) }],
    });
  }

  return drafts;
}
