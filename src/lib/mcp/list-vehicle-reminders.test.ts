import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const listOutbox = vi.fn();
const enqueueReminder = vi.fn();
const processDueOutbox = vi.fn();
const createTyraCase = vi.fn();

vi.mock("@/lib/tyra/reminders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tyra/reminders")>();
  return {
    ...actual,
    listOutbox: (...args: unknown[]) => listOutbox(...args),
    enqueueReminder: (...args: unknown[]) => enqueueReminder(...args),
    processDueOutbox: (...args: unknown[]) => processDueOutbox(...args),
  };
});

vi.mock("@/lib/tyra/cases", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tyra/cases")>();
  return {
    ...actual,
    createCase: (...args: unknown[]) => createTyraCase(...args),
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
    requestId: "tyra-outbox-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP list_vehicle_reminders", () => {
  beforeEach(() => {
    listOutbox.mockReset();
    enqueueReminder.mockReset();
    processDueOutbox.mockReset();
    createTyraCase.mockReset();
  });

  it("returns identity fields without recipient, subject or SMS body", async () => {
    listOutbox.mockResolvedValue([
      {
        id: "out-1",
        orgRef: actor.orgRef,
        channel: "sms",
        recipient: "+46700000000",
        subject: "Påminnelse: dags att byta till vinterhjul (ABC123)",
        body: "Hej!\n\nDet börjar bli dags att byta till vinterhjul.",
        status: "PENDING",
        lastError: "hemligt fel",
        createdAt: "2026-08-20T00:00:00.000Z",
      },
    ]);

    const tool = buildPixdriftRegistry().getTool("list_vehicle_reminders");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/create_vehicle_case/);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/tyra/reminders" });

    const result = (await tool!.handler(runtime(), { limit: 10 })) as {
      items: Record<string, unknown>[];
    };
    expect(listOutbox).toHaveBeenCalledWith({}, actor.orgRef);
    expect(enqueueReminder).not.toHaveBeenCalled();
    expect(processDueOutbox).not.toHaveBeenCalled();
    expect(createTyraCase).not.toHaveBeenCalled();
    expect(result.items).toEqual([
      {
        id: "out-1",
        channel: "sms",
        status: "PENDING",
        createdAt: "2026-08-20T00:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/Hej|vinterhjul|46700000000|hemligt|Påminnelse/i);
  });

  it("returns an empty page when the outbox is empty", async () => {
    listOutbox.mockResolvedValue([]);
    const tool = buildPixdriftRegistry().getTool("list_vehicle_reminders");
    const result = (await tool!.handler(runtime(), {})) as { items: unknown[] };
    expect(result.items).toEqual([]);
    expect(enqueueReminder).not.toHaveBeenCalled();
    expect(processDueOutbox).not.toHaveBeenCalled();
  });
});
