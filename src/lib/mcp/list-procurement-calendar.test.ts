import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const loadToraCalendar = vi.fn();
const resolveCompany = vi.fn();
const persistSnapshot = vi.fn();

vi.mock("@/lib/tora/market", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tora/market")>();
  return {
    ...actual,
    loadToraCalendar: (...args: unknown[]) => loadToraCalendar(...args),
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
    requestId: "tora-cal-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP list_procurement_calendar", () => {
  beforeEach(() => {
    loadToraCalendar.mockReset();
    resolveCompany.mockReset();
    persistSnapshot.mockReset();
    resolveCompany.mockResolvedValue({ name: "Exempelbolaget AB" });
  });

  it("returns identity fields and locked teasers without remedies, prices or alert bodies", async () => {
    loadToraCalendar.mockReturnValue({
      alertCount: 1,
      alerts: {
        state: "unlocked",
        value: [
          {
            id: "alert:1",
            type: "deadline_approaching",
            severity: "high",
            title: "hemlig avisering",
            body: "hemlig brödtext",
            opportunityId: "opp:demo:1",
            channels: ["sms", "email"],
            occurredAt: "2026-08-20",
          },
        ],
      },
      thisWeek: [
        {
          date: "2026-09-01",
          kind: "deadline",
          predicted: false,
          daysAway: 3,
          identified: true,
          organizationName: "Tyresö kommun",
          title: "Laddinfra",
          detail: "hemlig detalj",
          opportunityId: "opp:demo:1",
        },
      ],
      next30Days: [],
      next90Days: [],
      next12Months: [],
    });

    const tool = buildPixdriftRegistry().getTool("list_procurement_calendar");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/store a snapshot/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/tora/calendar" });

    const result = await tool!.handler(runtime(), {});
    expect(resolveCompany).toHaveBeenCalledWith({}, actor.orgRef);
    expect(loadToraCalendar).toHaveBeenCalledWith("enterprise", { name: "Exempelbolaget AB" });
    expect(persistSnapshot).not.toHaveBeenCalled();
    expect(result).toEqual({
      calendar: {
        alertCount: 1,
        alerts: {
          state: "unlocked",
          value: [
            {
              id: "alert:1",
              type: "deadline_approaching",
              severity: "high",
              occurredAt: "2026-08-20",
              opportunityId: "opp:demo:1",
            },
          ],
        },
        thisWeek: [
          {
            date: "2026-09-01",
            kind: "deadline",
            predicted: false,
            daysAway: 3,
            identified: true,
            organizationName: "Tyresö kommun",
            title: "Laddinfra",
            opportunityId: "opp:demo:1",
          },
        ],
        next30Days: [],
        next90Days: [],
        next12Months: [],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|walkthrough|prices|channels|detail/i);
  });

  it("returns locked alert teasers without unlocking content", async () => {
    loadToraCalendar.mockReturnValue({
      alertCount: 2,
      alerts: { state: "locked", teaser: "Lås upp för att se vad aviseringarna gäller." },
      thisWeek: [],
      next30Days: [],
      next90Days: [],
      next12Months: [],
    });

    const tool = buildPixdriftRegistry().getTool("list_procurement_calendar");
    const result = await tool!.handler(runtime(), {});
    expect(persistSnapshot).not.toHaveBeenCalled();
    expect(result).toEqual({
      calendar: {
        alertCount: 2,
        alerts: { state: "locked", teaser: "Lås upp för att se vad aviseringarna gäller." },
        thisWeek: [],
        next30Days: [],
        next90Days: [],
        next12Months: [],
      },
    });
  });
});
