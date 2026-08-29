import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  analysisSummary,
  analysisSummaryText,
  estimatedTotalHint,
  estimatedTotalHintText,
} from "../rita/findings.ts";

const NOTHING = {
  result: { summary: { found_nothing: true } },
};
const COUNTS = {
  result: {
    summary: {
      identified_opportunities: 2,
      high_priority_count: 1,
      found_nothing: false,
      estimated_total: { low: 0, high: 10000 },
    },
  },
};

describe("leftover RITA no-locale fallback language", () => {
  it("uses English-canonical leftover fallbacks like leftover status maps", () => {
    const source = readFileSync("src/lib/rita/findings.ts", "utf8");
    expect(source).toContain("The analysis found nothing to report.");
    expect(source).toContain("findings, of which ${high} high priority.");
    expect(source).toContain("About ${low}–${high} (no guarantee).");
    expect(source).not.toContain("Analysen hittade inget att rapportera.");
    expect(source).not.toContain("fynd, varav");
    expect(source).not.toContain("Stäm av med er rådgivare");
  });

  it("returns the English-canonical leftover sentences without locale", () => {
    expect(analysisSummary(NOTHING)).toBe("The analysis found nothing to report.");
    expect(analysisSummary(COUNTS)).toBe("2 findings, of which 1 high priority.");
    expect(estimatedTotalHint(COUNTS)).toMatch(/About 0 kr–100 kr \(no guarantee\)/);
    expect(analysisSummaryText(NOTHING, "sv")).toMatch(/inget/);
    expect(estimatedTotalHintText(COUNTS, "sv")).toMatch(/ingen garanti/);
  });

  it("leaves leftover kronor format and stored finding titles as written", () => {
    expect(readFileSync("src/lib/rita/findings.ts", "utf8")).toContain('NumberFormat("sv-SE"');
    expect(readFileSync("src/lib/rita/findings.test.ts", "utf8")).toContain("K10 löneuttag");
  });
});
