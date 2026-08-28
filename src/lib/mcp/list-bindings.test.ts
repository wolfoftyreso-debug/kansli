import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const listAgreements = vi.fn();
const listTyraCases = vi.fn();

vi.mock("@/lib/irma/agreements", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/irma/agreements")>();
  return {
    ...actual,
    listAgreements: (...args: unknown[]) => listAgreements(...args),
  };
});

vi.mock("@/lib/tyra/cases", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tyra/cases")>();
  return {
    ...actual,
    listCases: (...args: unknown[]) => listTyraCases(...args),
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
    requestId: "list-1",
    actor,
    pool: {},
    events: {},
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP list bindings", () => {
  beforeEach(() => {
    listAgreements.mockReset();
    listTyraCases.mockReset();
  });

  it("lists agreements by identity fields only", async () => {
    listAgreements.mockResolvedValue([
      {
        id: "agr-1",
        title: "Hyra",
        counterparty: "Anna",
        status: "sent",
        body: "hemlig brödtext",
        clauses: [{ id: "c1", text: "hemlig klausul" }],
        createdAt: "2026-08-01T00:00:00.000Z",
        signedAt: null,
        signerName: "ska-inte-med",
        artifactSha256: "abc",
        contentSha256: "def",
        verificationLevel: 0,
        tokenExpiresAt: "2026-08-08T00:00:00.000Z",
        viewedAt: "2026-08-02T00:00:00.000Z",
        magicLink: "/irma/l/secret",
      },
    ]);
    const tool = buildPixdriftRegistry().getTool("list_agreements");
    expect(tool).toBeTruthy();
    const result = (await tool!.handler(runtime(), { query: "Hyra", limit: 10 })) as {
      items: Record<string, unknown>[];
    };
    expect(listAgreements).toHaveBeenCalledWith({}, actor.orgRef, "Hyra");
    expect(result.items).toEqual([
      {
        id: "agr-1",
        title: "Hyra",
        counterparty: "Anna",
        status: "sent",
        createdAt: "2026-08-01T00:00:00.000Z",
        viewedAt: "2026-08-02T00:00:00.000Z",
        signedAt: null,
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/hemlig|magicLink|signerName|sha256/i);
  });

  it("lists vehicle cases by identity fields only", async () => {
    listTyraCases.mockResolvedValue([
      {
        id: "case-1",
        intent: "storage",
        caseStatus: "open",
        updatedAt: "2026-08-28T00:00:00.000Z",
        customerId: "cust-1",
        registrationNumber: "ABC999",
        customerName: "Anna Test",
      },
    ]);
    const tool = buildPixdriftRegistry().getTool("list_vehicle_cases");
    expect(tool).toBeTruthy();
    const result = (await tool!.handler(runtime(), { limit: 10 })) as {
      items: Record<string, unknown>[];
    };
    expect(listTyraCases).toHaveBeenCalledWith({}, actor.orgRef);
    expect(result.items).toEqual([
      {
        id: "case-1",
        intent: "storage",
        caseStatus: "open",
        updatedAt: "2026-08-28T00:00:00.000Z",
        customerId: "cust-1",
        registrationNumber: "ABC999",
        customerName: "Anna Test",
      },
    ]);
  });
});
