import { describe, expect, it } from "vitest";
import { parseTyraQuoteForm } from "./quotes.ts";

describe("parseTyraQuoteForm", () => {
  it("reads workshop kronor the same way the form sends them", () => {
    const form = new FormData();
    form.set("title", "Vinterdäck");
    form.set("quantity", "4");
    form.set("unitCostSek", "1200");
    form.set("markupPercent", "20");
    form.set("installationSek", "150");
    form.set("environmentalSek", "25");
    form.set("note", "kund väntar");
    expect(parseTyraQuoteForm(form)).toEqual({
      title: "Vinterdäck",
      quantity: 4,
      unitCostOre: 120_000,
      installationOrePerTyre: 15_000,
      environmentalOrePerTyre: 2_500,
      markupPercent: 20,
      note: "kund väntar",
    });
  });
});
