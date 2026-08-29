import { t, type Locale } from "../i18n";

export interface RitaFinding {
  id: string;
  title: string;
  status: string;
  rationale: string;
  recommendedAction: string;
  risk: string;
  category: string;
  ruleId: string;
  ruleTitle: string;
  impactLowOre: number | null;
  impactHighOre: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  tax: "Tax",
  vat: "VAT",
  payroll: "Payroll",
  corporate: "Company",
  risk: "Risk",
  k10: "K10",
};

const STATUS_LABELS: Record<string, string> = {
  identified: "Identified",
  verify: "Verify",
  warning: "Warning",
  rejected: "Rejected",
  cleared: "Cleared",
};

export function categoryLabel(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_LABELS[key] ?? (category.trim() || "Uncategorised");
}

export function findingStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function findingsFromAnalysis(result: unknown): RitaFinding[] {
  const opportunities = opportunitiesFrom(result);
  return opportunities.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const title = String(row.title ?? "").trim();
    if (!id || !title) return [];
    const rule = ruleFromOpportunity(row);
    const impact = impactFrom(row.impact);
    return [
      {
        id,
        title,
        status: String(row.status ?? "identified"),
        rationale: String(row.rationale ?? ""),
        recommendedAction: String(row.recommended_action ?? ""),
        risk: String(row.risk ?? ""),
        category: String(row.category ?? ""),
        ruleId: rule.id,
        ruleTitle: rule.title,
        impactLowOre: impact.low,
        impactHighOre: impact.high,
      },
    ];
  });
}

export function analysisSummary(result: unknown): string | null {
  return analysisSummaryText(result);
}

export function analysisSummaryText(result: unknown, locale?: Locale): string | null {
  const inner = innerResult(result);
  if (!inner) return null;
  const summary = inner["summary"];
  if (!summary || typeof summary !== "object") return null;
  const row = summary as Record<string, unknown>;
  const identified = Number(row.identified_opportunities ?? 0);
  const high = Number(row.high_priority_count ?? 0);
  const nothing = Boolean(row.found_nothing);
  if (nothing) {
    return locale ? t(locale, "rita.doc.foundNothing") : "Analysen hittade inget att rapportera.";
  }
  return locale
    ? t(locale, "rita.doc.summaryCounts", { identified, high })
    : `${identified} fynd, varav ${high} med hög prioritet.`;
}

export function analysisDisclaimer(result: unknown): string | null {
  const inner = innerResult(result);
  const text = typeof inner?.disclaimer === "string" ? inner.disclaimer.trim() : "";
  return text || null;
}

export function analysisLimitations(result: unknown): string[] {
  const inner = innerResult(result);
  const list = inner?.limitations;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (typeof item === "string" && item.trim()) return [item.trim()];
    if (item && typeof item === "object") {
      const statement = (item as Record<string, unknown>).statement;
      if (typeof statement === "string" && statement.trim()) return [statement.trim()];
    }
    return [];
  });
}

export function estimatedTotalHint(result: unknown): string | null {
  return estimatedTotalHintText(result);
}

export function estimatedTotalHintText(result: unknown, locale?: Locale): string | null {
  const inner = innerResult(result);
  const summary = inner?.summary;
  if (!summary || typeof summary !== "object") return null;
  const total = (summary as Record<string, unknown>).estimated_total;
  const impact = impactFrom(total);
  if (impact.high == null || impact.high <= 0) return null;
  const low = formatOre(impact.low ?? 0);
  const high = formatOre(impact.high);
  return locale
    ? t(locale, "rita.doc.totalHint", { low, high })
    : `Ungefär ${low}–${high} (ingen garanti). Stäm av med er rådgivare innan ni agerar.`;
}

export function formatOre(ore: number): string {
  return (
    new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(ore / 100)) +
    " kr"
  );
}

function ruleFromOpportunity(row: Record<string, unknown>): { id: string; title: string } {
  const evidence = Array.isArray(row.evidence) ? row.evidence : [];
  for (const item of evidence) {
    if (!item || typeof item !== "object") continue;
    const ev = item as Record<string, unknown>;
    if (String(ev.type ?? "") !== "rule") continue;
    const id = String(ev.rule_id ?? ev.id ?? "").trim();
    const title = String(ev.title ?? ev.source ?? "").trim();
    if (id || title) return { id, title };
  }
  const ids = Array.isArray(row.rule_ids) ? row.rule_ids : [];
  const first = typeof ids[0] === "string" ? ids[0].trim() : "";
  return { id: first, title: "" };
}

function impactFrom(value: unknown): { low: number | null; high: number | null } {
  if (!value || typeof value !== "object") return { low: null, high: null };
  const row = value as Record<string, unknown>;
  const low = Number(row.low);
  const high = Number(row.high);
  return {
    low: Number.isFinite(low) ? low : null,
    high: Number.isFinite(high) ? high : null,
  };
}

function opportunitiesFrom(result: unknown): unknown[] {
  const inner = innerResult(result);
  const list = inner?.["opportunities"];
  return Array.isArray(list) ? list : [];
}

function innerResult(result: unknown): Record<string, unknown> | null {
  if (!result || typeof result !== "object") return null;
  const obj = result as Record<string, unknown>;
  if (obj.result && typeof obj.result === "object") return obj.result as Record<string, unknown>;
  if (Array.isArray(obj.opportunities)) return obj;
  return obj;
}
