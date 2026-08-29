import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("lib required-language", () => {
  it("uses English-canonical required throws like the API layer", () => {
    const cases = readFileSync("src/lib/tyra/cases.ts", "utf8");
    const inspections = readFileSync("src/lib/tyra/inspections.ts", "utf8");
    const protocol = readFileSync("src/lib/alva/protocol.ts", "utf8");
    const invoices = readFileSync("src/lib/ekonomi/invoices.ts", "utf8");
    const profile = readFileSync("src/lib/tora/profile.ts", "utf8");
    expect(cases).toContain("Customer name is required.");
    expect(cases).toContain("Registration number is required.");
    expect(cases).toContain("At least one operation is required.");
    expect(cases).toContain("Storage code is required.");
    expect(inspections).toContain("All four positions are required (LF, RF, LR, RR).");
    expect(inspections).toContain("Invalid tread depth for ${position}.");
    expect(inspections).not.toContain("Ogiltigt mönsterdjup");
    expect(protocol).toContain("Observation requires a label.");
    expect(protocol).toContain("Measurement requires a name and a unit.");
    expect(protocol).toContain("A measurement value is required.");
    expect(invoices).toContain("Customer name is required.");
    expect(profile).toContain("Company name is required.");
    expect(cases).not.toContain("Kundnamn krävs.");
    expect(profile).not.toContain("Bolagsnamn krävs.");
  });

  it("leaves tenancy throws as written", () => {
    expect(readFileSync("src/lib/platform/tenancy.ts", "utf8")).toContain("orgRef krävs");
  });
});
