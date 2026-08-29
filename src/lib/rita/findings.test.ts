import { describe, expect, it } from "vitest";
import {
  analysisDisclaimer,
  analysisLimitations,
  analysisSummary,
  analysisSummaryText,
  categoryLabel,
  estimatedTotalHint,
  estimatedTotalHintText,
  findingsFromAnalysis,
} from "./findings.ts";

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
        ruleId: "",
        ruleTitle: "",
        impactLowOre: null,
        impactHighOre: null,
      },
    ]);
    expect(
      analysisSummary({
        result: {
          summary: { identified_opportunities: 1, high_priority_count: 1, found_nothing: false },
        },
      }),
    ).toMatch(/1 findings/);
  });

  it("returns nothing for blocked or empty results", () => {
    expect(findingsFromAnalysis(null)).toEqual([]);
    expect(findingsFromAnalysis({ status: "blocked" })).toEqual([]);
    expect(analysisSummary({ result: { summary: { found_nothing: true } } })).toMatch(
      /nothing to report/,
    );
  });

  it("surfaces rule, disclaimer and interval without promising a refund", () => {
    const result = {
      disclaimer: "Resultaten är preliminära. Ingen garanti om skatteåterbäring.",
      limitations: [{ statement: "Regelverket är inte granskat av rådgivare." }],
      summary: {
        identified_opportunities: 1,
        high_priority_count: 1,
        estimated_total: { low: 0, high: 12051000 },
      },
      opportunities: [
        {
          id: "k10",
          title: "K10 löneuttag",
          category: "tax",
          evidence: [{ type: "rule", rule_id: "se.tax.k10.lonekrav", title: "IL 57 kap." }],
          impact: { low: 0, high: 12051000 },
        },
      ],
    };
    const [finding] = findingsFromAnalysis(result);
    expect(finding?.ruleId).toBe("se.tax.k10.lonekrav");
    expect(finding?.ruleTitle).toMatch(/57 kap/);
    expect(categoryLabel(finding?.category ?? "")).toBe("Tax");
    expect(analysisDisclaimer(result)).toMatch(/Ingen garanti/);
    expect(analysisLimitations(result)[0]).toMatch(/rådgivare/);
    expect(estimatedTotalHint(result)).toMatch(/no guarantee/);
    expect(estimatedTotalHint(result)).not.toMatch(/Du sparar/);
    expect(estimatedTotalHintText(result, "en")).toMatch(/no guarantee/);
    expect(estimatedTotalHintText(result, "sv")).toMatch(/ingen garanti/);
    expect(analysisSummaryText({ result: { summary: { found_nothing: true } } }, "en")).toMatch(
      /nothing to report/,
    );
    expect(analysisSummaryText({ result: { summary: { found_nothing: true } } }, "sv")).toMatch(
      /inget/,
    );
  });
});
