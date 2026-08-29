import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const lookupOpsDebug = vi.fn();
const getRuntime = vi.fn();
const raiseOpsAlarms = vi.fn();

vi.mock("@/lib/platform/ops-debug", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/platform/ops-debug")>();
  return {
    ...actual,
    lookupOpsDebug: (...args: unknown[]) => lookupOpsDebug(...args),
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
    requestId: "ops-debug-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP lookup_ops_debug", () => {
  beforeEach(() => {
    lookupOpsDebug.mockReset();
    getRuntime.mockReset();
    raiseOpsAlarms.mockReset();
  });

  it("returns identity fields without payloads or outbox bodies", async () => {
    lookupOpsDebug.mockResolvedValue({
      q: "req-1",
      note: null,
      events: [
        {
          id: "evt-1",
          at: "2026-08-29T08:00:00.000Z",
          system: "ekonomi",
          kind: "ekonomi.invoice.issued",
          orgRef: actor.orgRef,
          requestId: "req-1",
          subjectRef: "ekonomi:invoice:1",
          actorRef: "user:demo",
          payload: { title: "Konto skapat", secret: "hemlig" },
        },
      ],
      outbox: [
        {
          source: "alarm",
          id: "out-1",
          status: "PENDING",
          body: "hemlig sms-kropp",
          lastError: "hemligt fel",
          createdAt: "2026-08-29T08:00:00.000Z",
        },
      ],
    });

    const tool = buildPixdriftRegistry().getTool("lookup_ops_debug");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/get_ops_snapshot/);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/platform/ops/debug" });

    const result = await tool!.handler(runtime(), { q: "req-1" });
    expect(lookupOpsDebug).toHaveBeenCalledWith(
      {},
      { q: "req-1", scope: "org", orgRef: actor.orgRef },
    );
    expect(getRuntime).not.toHaveBeenCalled();
    expect(raiseOpsAlarms).not.toHaveBeenCalled();
    expect(result).toEqual({
      q: "req-1",
      note: null,
      events: [
        {
          id: "evt-1",
          at: "2026-08-29T08:00:00.000Z",
          system: "ekonomi",
          kind: "ekonomi.invoice.issued",
          requestId: "req-1",
          subjectRef: "ekonomi:invoice:1",
        },
      ],
      outbox: [
        {
          source: "alarm",
          id: "out-1",
          status: "PENDING",
          createdAt: "2026-08-29T08:00:00.000Z",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|Konto skapat|secret|sms-kropp/i);
  });

  it("forwards a short query without writing", async () => {
    lookupOpsDebug.mockResolvedValue({
      q: "ab",
      events: [],
      outbox: [],
      note: "Enter at least three characters.",
    });
    const tool = buildPixdriftRegistry().getTool("lookup_ops_debug");
    const result = await tool!.handler(runtime(), { q: "ab" });
    expect(result).toEqual({
      q: "ab",
      note: "Enter at least three characters.",
      events: [],
      outbox: [],
    });
    expect(raiseOpsAlarms).not.toHaveBeenCalled();
  });
});
