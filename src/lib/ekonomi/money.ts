/** Integer öre only. Floats are rejected, never rounded silently. */

export const SEK = "SEK";

export const VAT_RATES_BPS = [0, 600, 1200, 2500] as const;
export type VatRateBps = (typeof VAT_RATES_BPS)[number];

export function assertOre(value: number, label = "belopp"): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} måste vara ett heltal öre ≥ 0.`);
  }
  return value;
}

export function vatOre(netOre: number, rateBps: VatRateBps): number {
  assertOre(netOre, "netto");
  return Math.round((netOre * rateBps) / 10_000);
}

export function lineTotals(input: {
  quantity: number;
  unitNetOre: number;
  vatRateBps: VatRateBps;
}): { netOre: number; vatOre: number; grossOre: number } {
  if (!Number.isInteger(input.quantity) || input.quantity < 1) {
    throw new Error("antal måste vara ett heltal ≥ 1.");
  }
  const netOre = assertOre(input.unitNetOre, "á-pris") * input.quantity;
  const vat = vatOre(netOre, input.vatRateBps);
  return { netOre, vatOre: vat, grossOre: netOre + vat };
}

export function formatSek(ore: number): string {
  const sign = ore < 0 ? "−" : "";
  const abs = Math.abs(ore);
  const kronor = Math.trunc(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  return `${sign}${kronor.toLocaleString("sv-SE")},${rest} kr`;
}

export function parseVatRateBps(value: unknown): VatRateBps {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n === "number" && (VAT_RATES_BPS as readonly number[]).includes(n)) {
    return n as VatRateBps;
  }
  throw new Error("moms måste vara 0, 6, 12 eller 25 %.");
}

export function vatLabel(rateBps: number): string {
  return `${rateBps / 100} %`;
}
