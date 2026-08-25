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
  return formatMoney(ore, SEK);
}

export function formatMoney(ore: number, currency: string): string {
  const sign = ore < 0 ? "−" : "";
  const abs = Math.abs(ore);
  const major = Math.trunc(abs / 100);
  const rest = String(abs % 100).padStart(2, "0");
  const suffix = currency === SEK ? "kr" : currency;
  return `${sign}${major.toLocaleString("sv-SE")},${rest} ${suffix}`;
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

/** People type kronor. The book stores öre. */
export function parseKronorToOre(raw: string, label = "belopp"): number {
  const cleaned = raw
    .trim()
    .replace(/kr$/i, "")
    .trim()
    .replace(/[\s\u00a0\u202f]/g, "");
  if (!cleaned) throw new Error(`${label} saknas.`);
  if (!/^\d+([.,]\d{1,2})?$/.test(cleaned)) {
    throw new Error(`${label} måste vara kronor, högst två decimaler.`);
  }
  const normalized = cleaned.replace(",", ".");
  const [whole, frac = ""] = normalized.split(".");
  const ore = Number(whole) * 100 + Number((frac + "00").slice(0, 2));
  return assertOre(ore, label);
}

/** Inverse of formatSek for form fields. */
export function formatKronorInput(ore: number): string {
  assertOre(ore, "belopp");
  const major = Math.trunc(ore / 100);
  const rest = ore % 100;
  if (rest === 0) return String(major);
  return `${major},${String(rest).padStart(2, "0")}`;
}

/**
 * Workshop quotes are customer prices including VAT.
 * Find net so net + moms = the quoted gross, or at most one öre off.
 */
export function netOreFromGross(
  grossOre: number,
  vatRateBps: VatRateBps,
  label = "belopp",
): number {
  assertOre(grossOre, label);
  if (vatRateBps === 0) return grossOre;
  const guess = Math.round((grossOre * 10_000) / (10_000 + vatRateBps));
  let best = guess;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (const delta of [0, -1, 1, -2, 2, -3, 3]) {
    const net = guess + delta;
    if (net < 0) continue;
    const diff = Math.abs(net + vatOre(net, vatRateBps) - grossOre);
    if (diff < bestDiff) {
      best = net;
      bestDiff = diff;
    }
    if (diff === 0) return net;
  }
  if (bestDiff <= 1) return best;
  throw new Error(`${label} går inte att dela i netto och moms så att summan stämmer.`);
}
