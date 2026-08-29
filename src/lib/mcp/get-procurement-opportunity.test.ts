import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const loadToraOpportunity = vi.fn();
const resolveCompany = vi.fn();
const persistSnapshot = vi.fn();

vi.mock("@/lib/tora/market", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tora/market")>();
  return {
    ...actual,
    loadToraOpportunity: (...args: unknown[]) => loadToraOpportunity(...args),
  };
});

vi.mock("@/lib/tora/profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tora/profile")>();
  return {
    ...actual,
    resolveCompany: (...args: unknown[]) => resolveCompany(...args),
  };
});

vi.mock("@/lib/tora/persist", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tora/persist")>();
  return {
    ...actual,
    persistSnapshot: (...args: unknown[]) => persistSnapshot(...args),
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
    requestId: "tora-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_procurement_opportunity", () => {
  beforeEach(() => {
    loadToraOpportunity.mockReset();
    resolveCompany.mockReset();
    persistSnapshot.mockReset();
    resolveCompany.mockResolvedValue({ name: "Exempelbolaget AB" });
  });

  it("returns identity fields and locked teasers without remedies or prices", async () => {
    loadToraOpportunity.mockReturnValue({
      view: {
        id: "opp:demo:1",
        verdict: "ELIGIBLE",
        signal: "strong",
        timing: "open_now",
        scoreBand: "80–89",
        organizationKindHint: "kommun",
        organizationName: { state: "unlocked", value: "Tyresö kommun" },
        title: { state: "unlocked", value: "Laddinfra" },
        deadlineAt: { state: "unlocked", value: "2026-09-01" },
        daysUntilDeadline: { state: "unlocked", value: 12 },
        rationale: { state: "unlocked", value: "hemlig motivering" },
        recommendedActions: { state: "unlocked", value: [{ action: "hemlig åtgärd" }] },
      },
      walkthrough: { steps: ["hemlig guide"] },
      prices: { state: "unlocked", value: { unit: "hemligt pris" } },
      documents: { items: ["hemlig handling"] },
    });

    const tool = buildPixdriftRegistry().getTool("get_procurement_opportunity");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/store a snapshot/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/tora/opportunities/:id" });

    const result = await tool!.handler(runtime(), { id: "opp:demo:1" });
    expect(resolveCompany).toHaveBeenCalledWith({}, actor.orgRef);
    expect(loadToraOpportunity).toHaveBeenCalledWith("enterprise", "opp:demo:1", {
      name: "Exempelbolaget AB",
    });
    expect(persistSnapshot).not.toHaveBeenCalled();
    expect(result).toEqual({
      opportunity: {
        id: "opp:demo:1",
        verdict: "ELIGIBLE",
        signal: "strong",
        timing: "open_now",
        scoreBand: "80–89",
        organizationKindHint: "kommun",
        organizationName: { state: "unlocked", value: "Tyresö kommun" },
        title: { state: "unlocked", value: "Laddinfra" },
        deadlineAt: { state: "unlocked", value: "2026-09-01" },
        daysUntilDeadline: { state: "unlocked", value: 12 },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|walkthrough|prices|documents/i);
  });

  it("returns not_found when the opportunity is missing", async () => {
    loadToraOpportunity.mockReturnValue(undefined);
    const tool = buildPixdriftRegistry().getTool("get_procurement_opportunity");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(persistSnapshot).not.toHaveBeenCalled();
  });
});
