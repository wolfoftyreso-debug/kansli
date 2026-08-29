import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const loadOpsSnapshot = vi.fn();
const getRuntime = vi.fn();
const raiseOpsAlarms = vi.fn();

vi.mock("@/lib/platform/ops", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/platform/ops")>();
  return {
    ...actual,
    loadOpsSnapshot: (...args: unknown[]) => loadOpsSnapshot(...args),
  };
});

vi.mock("@/lib/platform/runtime", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/platform/runtime")>();
  return {
    ...actual,
    getRuntime: (...args: unknown[]) => getRuntime(...args),
  };
});

vi.mock("@/lib/platform/ops-desk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/platform/ops-desk")>();
  return {
    ...actual,
    raiseOpsAlarms: (...args: unknown[]) => raiseOpsAlarms(...args),
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
    requestId: "ops-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_ops_snapshot", () => {
  beforeEach(() => {
    loadOpsSnapshot.mockReset();
    getRuntime.mockReset();
    raiseOpsAlarms.mockReset();
  });

  it("returns identity counts and health flags without phones, SMS bodies or debug dumps", async () => {
    loadOpsSnapshot.mockResolvedValue({
      takenAt: "2026-08-29T08:00:00.000Z",
      scope: "org",
      orgRef: actor.orgRef,
      orgName: "Exempelbolaget",
      runtime: "local",
      hardened: false,
      health: {
        database: "up",
        gateway: { configured: false, auth: "none" },
        rita: { available: true, kind: "local", modelReady: true },
        sms: false,
        tts: false,
        credit: false,
        webintel: false,
        revolut: { configured: false, environment: "sandbox" },
        mcp: {
          mcp_requests_total: 3,
          mcp_tool_calls_total: 2,
          mcp_tool_errors_total: 0,
        },
      },
      identity: { organizations: 1, users: 2, memberships: 2 },
      events: [{ system: "ekonomi", count: 4, lastAt: "2026-08-28T00:00:00.000Z" }],
      readiness: {
        pilotOfferable: false,
        allSystemsReady: false,
        gates: [
          { id: "sms", title: "hemlig grind", state: "blocked", detail: "hemlig detalj" },
          { id: "db", title: "ok", state: "ready", detail: "ok" },
        ],
      },
      ledger: {
        openCount: 1,
        overdueCount: 0,
        notDueOre: 10000,
        overdueOre: 0,
        overdue: [{ id: "inv-1", customerName: "hemlig kund", openOre: 10000 }],
      },
      support: {
        open: 1,
        observations: 0,
        tasks: 1,
        cases: 0,
        intakes: 0,
        items: [{ id: "t-1", title: "hemlig uppgift" }],
      },
      sms: {
        vendor: false,
        phone: "+46700000000",
        routes: [{ kind: "overdue", phone: "+46700000000", enabled: true }],
        outbox: [{ id: "sms-1", body: "hemlig sms-kropp", status: "PENDING" }],
      },
      queues: {
        sales: { pending: 0, sent: 0, failed: 0, blocked: 0 },
        alarms: { pending: 0, sent: 0, failed: 0, blocked: 0 },
        reminders: { pending: 0, sent: 0, failed: 0, blocked: 0 },
      },
      lastErrors: [{ headline: "hemligt fel" }],
      runtimeDebug: { sessionSecretSet: true },
      notices: [{ title: "hemligt larm" }],
      recent: [{ headline: "Konto skapat" }],
    });

    const tool = buildPixdriftRegistry().getTool("get_ops_snapshot");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/list_family_events/);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/platform/ops" });

    const result = await tool!.handler(runtime(), {});
    expect(loadOpsSnapshot).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ orgRef: actor.orgRef, scope: "org" }),
    );
    expect(getRuntime).not.toHaveBeenCalled();
    expect(raiseOpsAlarms).not.toHaveBeenCalled();
    expect(result).toEqual({
      snapshot: {
        takenAt: "2026-08-29T08:00:00.000Z",
        scope: "org",
        orgRef: actor.orgRef,
        orgName: "Exempelbolaget",
        runtime: "local",
        hardened: false,
        health: {
          database: "up",
          gatewayConfigured: false,
          ritaAvailable: true,
          sms: false,
          tts: false,
          credit: false,
          webintel: false,
          revolutConfigured: false,
          mcp: { requests: 3, toolCalls: 2, toolErrors: 0 },
        },
        identity: { organizations: 1, users: 2, memberships: 2 },
        events: [{ system: "ekonomi", count: 4, lastAt: "2026-08-28T00:00:00.000Z" }],
        readiness: { pilotOfferable: false, allSystemsReady: false, blockedGates: 1 },
        ledger: { openCount: 1, overdueCount: 0, notDueOre: 10000, overdueOre: 0 },
        support: { open: 1, observations: 0, tasks: 1, cases: 0, intakes: 0 },
        sms: { vendor: false, routeCount: 1 },
        queues: {
          sales: { pending: 0, sent: 0, failed: 0, blocked: 0 },
          alarms: { pending: 0, sent: 0, failed: 0, blocked: 0 },
          reminders: { pending: 0, sent: 0, failed: 0, blocked: 0 },
        },
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /hemlig|46700000000|Konto skapat|sessionSecret|sms-kropp/i,
    );
  });
});
