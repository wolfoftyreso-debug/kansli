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

export function legalBasisText(field: Locked<{ contractId: string; reason: string } | undefined>): {
  locked: boolean;
  reason: string;
  contractId?: string;
} {
  if (field.state === "locked") return { locked: true, reason: field.teaser };
  if (!field.value) return { locked: false, reason: "Ingen rättslig grund i underlaget." };
  return { locked: false, reason: field.value.reason, contractId: field.value.contractId };
}
