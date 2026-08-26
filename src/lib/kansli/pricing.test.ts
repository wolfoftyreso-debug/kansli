import { describe, expect, it } from "vitest";
import {
  ALL_MODULES_MONTHLY_NET_ORE,
  kronor,
  MODULE_PRICING,
  parseModules,
  priceOrder,
  SELLABLE_MODULES,
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
    expect(() => priceOrder([])).toThrow(/minst en modul/);
  });

  it("parses only known modules, once each", () => {
    expect(parseModules(["tyra", "tyra", "nope", "ekonomi"])).toEqual(["tyra", "ekonomi"]);
  });

  it("prints kronor from öre without rounding money away", () => {
    expect(kronor(99_000)).toBe("990 kr");
    expect(kronor(34_900)).toBe("349 kr");
    // sv-SE groups thousands with a non-breaking space.
    expect(kronor(118_375).replace(/\u00a0|\u202f/g, " ")).toBe("1 183,75 kr");
  });
});
