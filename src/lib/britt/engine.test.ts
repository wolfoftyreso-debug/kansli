import { describe, expect, it } from "vitest";
import { DEMO_METRICS, evaluateMetrics } from "./engine.ts";

describe("evaluateMetrics", () => {
  it("raises revenue, liquidity and concentration on the demo facts", () => {
    const findings = evaluateMetrics(DEMO_METRICS);
    expect(findings.map((item) => item.fingerprint)).toEqual([
      "revenue_below_plan",
      "liquidity_runway",
      "customer_concentration",
    ]);
    expect(findings.find((item) => item.fingerprint === "revenue_below_plan")?.severity).toBe(
      "high",
    );
    expect(findings.find((item) => item.fingerprint === "liquidity_runway")?.severity).toBe("high");
    expect(findings.find((item) => item.fingerprint === "customer_concentration")?.severity).toBe(
      "medium",
    );
  });

  it("stays quiet when the numbers are healthy", () => {
    expect(
      evaluateMetrics({
        period: "2026-07",
        revenue: 1_200_000,
        planRevenue: 1_200_000,
        cash: 2_400_000,
        monthlyBurn: 400_000,
        topCustomerShare: 0.2,
      }),
    ).toEqual([]);
  });
});
