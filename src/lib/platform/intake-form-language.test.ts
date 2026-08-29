import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseIntakeForm } from "../kansli/intakes.ts";
import { priceOrder } from "../kansli/pricing.ts";

describe("intake form language", () => {
  it("uses English-canonical required throws like the API layer", () => {
    const intakes = readFileSync("src/lib/kansli/intakes.ts", "utf8");
    const pricing = readFileSync("src/lib/kansli/pricing.ts", "utf8");
    const route = readFileSync("src/app/api/kansli/intake/route.ts", "utf8");
    expect(intakes).toContain("Company name is required.");
    expect(intakes).toContain("Contact person is required.");
    expect(intakes).toContain("A valid work email is required.");
    expect(intakes).toContain("Pick at least one module.");
    expect(intakes).toContain("The terms box must be checked. Registration creates an invoice.");
    expect(pricing).toContain("Pick at least one module.");
    expect(route).toContain("minst en modul|at least one module");
    expect(intakes).not.toContain("bolagsnamn krävs.");
    expect(intakes).not.toContain("kontaktperson krävs.");
    expect(intakes).not.toContain("villkorsrutan måste kryssas.");
    expect(pricing).not.toContain("välj minst en modul.");
  });

  it("refuses incomplete forms with the English-canonical throws", () => {
    const empty = new FormData();
    expect(() => parseIntakeForm(empty, "pixdrift:org:org-exempelbolaget")).toThrow(
      /Company name is required/,
    );
    empty.set("companyName", "Bilia Personbilar AB");
    expect(() => parseIntakeForm(empty, "pixdrift:org:org-exempelbolaget")).toThrow(
      /Contact person is required/,
    );
    empty.set("contactName", "Anna Inköp");
    expect(() => parseIntakeForm(empty, "pixdrift:org:org-exempelbolaget")).toThrow(
      /A valid work email is required/,
    );
    empty.set("contactEmail", "anna@bilia.se");
    expect(() => parseIntakeForm(empty, "pixdrift:org:org-exempelbolaget")).toThrow(
      /at least one module/,
    );
    empty.append("modules", "tyra");
    expect(() => parseIntakeForm(empty, "pixdrift:org:org-exempelbolaget")).toThrow(
      /terms box must be checked/,
    );
    expect(() => priceOrder([])).toThrow(/at least one module/);
  });

  it("leaves the Swedish UI catalog and invoice module lines as written", () => {
    expect(readFileSync("src/lib/i18n/sv.ts", "utf8")).toContain("Välj minst en modul.");
    expect(readFileSync("src/lib/kansli/pricing.ts", "utf8")).toContain("del måste vara 1–");
  });
});
