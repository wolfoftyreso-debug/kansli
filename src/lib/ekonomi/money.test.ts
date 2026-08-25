import { describe, expect, it } from "vitest";
import { formatMoney, formatSek, lineTotals, vatOre } from "./money.ts";

describe("money", () => {
  it("computes Swedish 25 % VAT in öre", () => {
    expect(vatOre(10000, 2500)).toBe(2500);
    expect(lineTotals({ quantity: 2, unitNetOre: 5000, vatRateBps: 2500 })).toEqual({
      netOre: 10000,
      vatOre: 2500,
      grossOre: 12500,
    });
  });

  it("rejects fractional öre", () => {
    expect(() => vatOre(10.5, 2500)).toThrow(/heltal/);
  });

  it("formats SEK without inventing decimals", () => {
    expect(formatSek(12500)).toBe("125,00 kr");
    expect(formatSek(312_500)).toMatch(/3\s125,00 kr/);
    expect(formatMoney(-1250, "EUR")).toBe("−12,50 EUR");
  });
});
