import { describe, expect, it } from "vitest";
import {
  ALL_MODULES_MONTHLY_NET_ORE,
  instalmentDueDays,
  kronor,
  MODULE_PRICING,
  orderSpecification,
  parseModules,
  priceOrder,
  SELLABLE_MODULES,
  YEAR_INSTALMENTS,
  yearNetOre,
} from "./pricing.ts";

describe("self-service pricing", () => {
  it("prices a single module at its own monthly rate", () => {
    const order = priceOrder(["tyra"]);
    expect(order.modules).toEqual(["tyra"]);
    expect(order.capped).toBe(false);
    expect(order.monthlyNetOre).toBe(34_900);
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0]!.description).toContain("TYRA");
  });

  it("sums several modules", () => {
    const order = priceOrder(["irma", "britt"]);
    expect(order.monthlyNetOre).toBe(24_900 + 14_900);
    expect(order.lines).toHaveLength(2);
    expect(order.capped).toBe(false);
  });

  it("caps at the all-modules price and upgrades to everything", () => {
    const order = priceOrder(["ekonomi", "tyra", "irma", "tora"]);
    expect(order.capped).toBe(true);
    expect(order.monthlyNetOre).toBe(ALL_MODULES_MONTHLY_NET_ORE);
    expect(order.modules).toEqual([...SELLABLE_MODULES]);
    expect(order.lines).toHaveLength(1);
  });

  it("never charges more than the cap for the full catalog", () => {
    const order = priceOrder([...SELLABLE_MODULES]);
    expect(order.monthlyNetOre).toBe(ALL_MODULES_MONTHLY_NET_ORE);
    const sum = SELLABLE_MODULES.reduce((acc, id) => acc + MODULE_PRICING[id].monthlyNetOre, 0);
    expect(sum).toBeGreaterThan(ALL_MODULES_MONTHLY_NET_ORE);
  });

  it("refuses an empty selection", () => {
    expect(() => priceOrder([])).toThrow(/at least one module/);
  });

  it("parses only known modules, once each", () => {
    expect(parseModules(["tyra", "tyra", "nope", "ekonomi"])).toEqual(["tyra", "ekonomi"]);
  });

  it("spreads ten instalments over the year, first due in ten days", () => {
    expect(YEAR_INSTALMENTS).toBe(10);
    expect(instalmentDueDays(1)).toBe(10);
    expect(instalmentDueDays(2)).toBe(40);
    expect(instalmentDueDays(10)).toBe(280);
    expect(() => instalmentDueDays(0)).toThrow(/The instalment must be 1–10/);
    expect(() => instalmentDueDays(11)).toThrow(/The instalment must be 1–10/);
    expect(yearNetOre(priceOrder(["tyra"]))).toBe(34_900 * 10);
  });

  it("writes a detailed order specification for the one-row invoices", () => {
    const raw = orderSpecification(priceOrder(["tyra", "irma"]), {
      companyName: "Bilia Personbilar AB",
      orgNumber: "556016-0680",
      contactName: "Anna Andersson",
      contactEmail: "anna@bilia.se",
      registeredAt: new Date("2026-08-26T12:00:00.000Z"),
    });
    const spec = raw.replace(/\u00a0|\u202f/g, " ");
    expect(spec).toContain("ORDERSPECIFIKATION — PIXDRIFT");
    expect(spec).toContain("Bilia Personbilar AB (556016-0680)");
    expect(spec).toContain("Avtalsperiod: 12 månader, 2026-08-26 – 2027-08-26");
    expect(spec).toContain("TYRA — däckhotell och kundkort · 349 kr/mån exkl. moms");
    expect(spec).toContain("IRMA — digitala avtal · 249 kr/mån exkl. moms");
    expect(spec).toContain("BETALPLAN — 10 fakturor, utställda samtidigt");
    expect(spec).toContain("Del 1 av 10");
    expect(spec).toContain("förfaller 2026-09-05");
    expect(spec).toContain("Del 10 av 10");
    expect(spec).toContain("förfaller 2027-06-02");
    // Year price: (349+349... no: tyra 349 + irma 249 = 598) × 10 = 5 980 kr net.
    expect(spec).toContain("10 betalningar för 12 månader — 5 980 kr exkl. moms");
    expect(spec).toContain("Kansli och plattformen ingår utan kostnad.");
  });

  it("lists the capped bundle with modules as included in the specification", () => {
    const spec = orderSpecification(priceOrder([...SELLABLE_MODULES]), {
      companyName: "Allt AB",
      contactName: "Alva Allt",
      contactEmail: "alva@allt.se",
      registeredAt: new Date("2026-08-26T12:00:00.000Z"),
    }).replace(/\u00a0|\u202f/g, " ");
    expect(spec).toContain("Hela Pixdrift — alla moduler · 990 kr/mån exkl. moms");
    expect(spec).toContain("TYRA — däckhotell och kundkort · ingår");
    expect(spec).toContain("9 900 kr exkl. moms");
  });

  it("prints kronor from öre without rounding money away", () => {
    expect(kronor(99_000)).toBe("990 kr");
    expect(kronor(34_900)).toBe("349 kr");
    // sv-SE groups thousands with a non-breaking space.
    expect(kronor(118_375).replace(/\u00a0|\u202f/g, " ")).toBe("1 183,75 kr");
  });
});
