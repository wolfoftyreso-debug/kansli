import type { Locked, OpportunityView } from "@pixdrift/tora";

export function displayField(value: Locked<unknown>): string {
  if (value.state === "locked") return value.teaser;
  if (value.value === undefined || value.value === null) return "—";
  return String(value.value);
}

export function sek(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";
}

export function opportunityHref(item: Pick<OpportunityView, "id">): string {
  return `/tora/${encodeURIComponent(item.id)}`;
}

const EVALUATION_KIND: Record<string, string> = {
  lowest_price: "Lägsta pris",
  best_price_quality_ratio: "Bästa förhållandet mellan pris och kvalitet",
  fixed_price_best_quality: "Fast pris, bästa kvalitet",
};

export function evaluationKindText(kind: string): string {
  return EVALUATION_KIND[kind] ?? kind;
}

const VERDICT_TEXT: Record<string, string> = {
  RIGHT: "Ni är redan med",
  ELIGIBLE: "Ni kan lämna anbud",
  POSSIBLE: "Går om ni gör en sak först",
  COMPETITIVE: "Öppen tävling",
  NOT_ELIGIBLE: "Ni kan inte lämna anbud",
  UNKNOWN: "Vi vet inte än",
};

export function verdictText(verdict: string): string {
  return VERDICT_TEXT[verdict] ?? verdict;
}

const TIMING_TEXT: Record<string, string> = {
  open_now: "Öppen nu",
  upcoming: "Kommande",
  watch: "Bevakning",
  closed: "Stängd",
};

export function timingText(timing: string): string {
  return TIMING_TEXT[timing] ?? timing;
}

export function legalBasisText(field: Locked<{ contractId: string; reason: string } | undefined>): {
  locked: boolean;
  reason: string;
  contractId?: string;
  fallback?: boolean;
} {
  if (field.state === "locked") return { locked: true, reason: field.teaser };
  if (!field.value)
    return {
      locked: false,
      fallback: true,
      reason: "Underlaget säger inte att just ni ska få jobbet.",
    };
  return { locked: false, reason: field.value.reason, contractId: field.value.contractId };
}
