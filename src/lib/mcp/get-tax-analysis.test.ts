import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const getAnalysis = vi.fn();
const requestAnalysis = vi.fn();

vi.mock("@/lib/rita/analyses", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rita/analyses")>();
  return {
    ...actual,
    getAnalysis: (...args: unknown[]) => getAnalysis(...args),
    requestAnalysis: (...args: unknown[]) => requestAnalysis(...args),
  };
});

import { buildPixdriftRegistry } from "./tools";

const actor: Actor = {
  sub: "user:demo",
  email: "demo@exempelbolaget.se",
  name: "Demo",
  orgRef: "pixdrift:org:demo",
  orgName: "Exempelbolaget",
  tier: "enterprise",
  permissions: [],
};

function runtime() {
  return {
    requestId: "rita-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_tax_analysis", () => {
  beforeEach(() => {
    getAnalysis.mockReset();
    requestAnalysis.mockReset();
  });

  it("returns identity fields and finding titles without the raw engine result", async () => {
    getAnalysis.mockResolvedValue({
      id: "an-1",
      orgRef: actor.orgRef,
      companyName: "Exempelbolaget AB",
      orgNumber: "556000-0000",
      status: "completed",
      blockedReason: null,
      result: {
        opportunities: [
          {
            id: "f-1",
            title: "K10 löneuttag",
            status: "identified",
            rationale: "hemlig motivering",
            recommendedAction: "hemlig åtgärd",
            risk: "hemlig risk",
            category: "k10",
            ruleId: "K10-1",
            ruleTitle: "hemlig regel",
            impact: { low: 10_000, high: 20_000 },
          },
        ],
      },
      createdAt: "2026-08-28T00:00:00.000Z",
    });

    const tool = buildPixdriftRegistry().getTool("get_tax_analysis");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/start a new analysis/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/rita/analyses/:id" });

    const result = await tool!.handler(runtime(), { id: "an-1" });
    expect(getAnalysis).toHaveBeenCalledWith({}, actor.orgRef, "an-1");
    expect(requestAnalysis).not.toHaveBeenCalled();
    expect(result).toEqual({
      analysis: {
        id: "an-1",
        companyName: "Exempelbolaget AB",
        orgNumber: "556000-0000",
        status: "completed",
        blockedReason: null,
        createdAt: "2026-08-28T00:00:00.000Z",
        findings: [
          {
            id: "f-1",
            title: "K10 löneuttag",
            status: "identified",
            category: "k10",
            impactLowOre: 10_000,
            impactHighOre: 20_000,
          },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|opportunities|orgRef/);
  });

  it("returns not_found when the analysis is missing", async () => {
    getAnalysis.mockResolvedValue(null);
    const tool = buildPixdriftRegistry().getTool("get_tax_analysis");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(requestAnalysis).not.toHaveBeenCalled();
  });
});
