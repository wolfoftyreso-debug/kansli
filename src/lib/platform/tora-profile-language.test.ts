import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { upsertCompanyProfile } from "../tora/profile.ts";

describe("TORA profile leftover-throw language", () => {
  it("uses English-canonical leftover save throws like required company name", () => {
    const profile = readFileSync("src/lib/tora/profile.ts", "utf8");
    expect(profile).toContain("Company name is required.");
    expect(profile).toContain("The profile could not be saved.");
    expect(profile).not.toContain("Profilen kunde inte sparas.");
  });

  it("throws the English-canonical sentences without saving a profile", async () => {
    await expect(
      upsertCompanyProfile({
        pool: { query: async () => ({ rows: [] }) } as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        name: "   ",
        servesAreas: [],
        capabilities: [],
        certifications: [],
        registrations: [],
      }),
    ).rejects.toThrow(/Company name is required/);

    let queries = 0;
    await expect(
      upsertCompanyProfile({
        pool: {
          query: async () => {
            queries += 1;
            return { rows: [] };
          },
        } as never,
        orgRef: "pixdrift:org:org-exempelbolaget",
        name: "Pilotverkstad Holm AB",
        servesAreas: [],
        capabilities: [],
        certifications: [],
        registrations: [],
      }),
    ).rejects.toThrow(/The profile could not be saved/);
    expect(queries).toBe(2);
  });

  it("leaves leftover invoice-book throws as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
  });
});
