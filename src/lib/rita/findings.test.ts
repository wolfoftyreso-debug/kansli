import { describe, expect, it } from "vitest";
import { analysisSummary, findingsFromAnalysis } from "./findings.ts";

describe("findingsFromAnalysis", () => {
  it("reads opportunities from an envelope.result", () => {
    const findings = findingsFromAnalysis({
      contract_version: "1",
      result: {
        summary: { identified_opportunities: 1, high_priority_count: 1, found_nothing: false },
        opportunities: [
          {
            id: "opp-1",
            title: "Momsavvikelse",
            status: "warning",
            rationale: "Beloppet stämmer inte mot underlaget.",
            recommended_action: "Stäm av mot bokföringen.",
            risk: "high",
            category: "vat",
          },
        ],
      },
    });
    expect(findings).toEqual([
      {
        id: "opp-1",
        title: "Momsavvikelse",
        status: "warning",
        rationale: "Beloppet stämmer inte mot underlaget.",
        recommendedAction: "Stäm av mot bokföringen.",
        risk: "high",
        category: "vat",
      },
    ]);
    expect(
      analysisSummary({
        result: {
          summary: { identified_opportunities: 1, high_priority_count: 1, found_nothing: false },
        },
      }),
    ).toMatch(/1 fynd/);
  });

  it("returns nothing for blocked or empty results", () => {
    expect(findingsFromAnalysis(null)).toEqual([]);
    expect(findingsFromAnalysis({ status: "blocked" })).toEqual([]);
    expect(analysisSummary({ result: { summary: { found_nothing: true } } })).toMatch(/inget/);
  });
});
