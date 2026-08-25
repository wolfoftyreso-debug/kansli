import { describe, expect, it } from "vitest";
import {
  formatKronorInput,
  formatMoney,
  formatSek,
  lineTotals,
  netOreFromGross,
  parseKronorToOre,
  vatOre,
} from "./money.ts";

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

  it("parses kronor that people actually type", () => {
    expect(parseKronorToOre("2500")).toBe(250_000);
    expect(parseKronorToOre("2 500")).toBe(250_000);
    expect(parseKronorToOre("2500,50")).toBe(250_050);
    expect(parseKronorToOre("2500.5")).toBe(250_050);
    expect(parseKronorToOre("125 kr")).toBe(12_500);
    expect(formatKronorInput(250_050)).toBe("2500,50");
    expect(formatKronorInput(12_500)).toBe("125");
    expect(() => parseKronorToOre("2500,505")).toThrow(/två decimaler/);
    expect(() => parseKronorToOre("2.500")).toThrow(/två decimaler/);
    expect(() => parseKronorToOre("")).toThrow(/saknas/);
  });

  it("finds net so 25 % VAT lands on the quoted gross", () => {
    expect(netOreFromGross(12_500, 2500)).toBe(10_000);
    expect(netOreFromGross(646_000, 2500)).toBe(516_800);
    const net = netOreFromGross(499_500, 2500);
    expect(net + vatOre(net, 2500)).toBe(499_500);
  });
});
