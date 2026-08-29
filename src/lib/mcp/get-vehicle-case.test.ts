import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const getCaseWorkCard = vi.fn();
const createTyraCase = vi.fn();

vi.mock("@/lib/tyra/cases", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/tyra/cases")>();
  return {
    ...actual,
    getCaseWorkCard: (...args: unknown[]) => getCaseWorkCard(...args),
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
    requestId: "case-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_vehicle_case", () => {
  beforeEach(() => {
    getCaseWorkCard.mockReset();
    createTyraCase.mockReset();
  });

  it("returns identity fields and steps without contact or advisor notes", async () => {
    getCaseWorkCard.mockResolvedValue({
      caseId: "case-1",
      customerId: "cust-1",
      customerName: "Anna Andersson",
      customerPhone: "0701234567",
      customerEmail: "anna@example.com",
      vehicleId: "veh-1",
      registrationNumber: "ABC123",
      make: "Volvo",
      model: "XC60",
      caseStatus: "IN_PROGRESS",
      advisorNotes: "Kund hämtar fredag.",
      storageCode: "A-04",
      wheelSetId: "ws-1",
      headline: "VOLVO XC60 — ABC123",
      summary: "Hjulskifte från lager · Tvätt",
      nextBestAction: { title: "Nästa: Hämta hjul", stepKind: "FETCH_WHEELS" },
      steps: [
        {
          kind: "FETCH_WHEELS",
          title: "Hämta hjul",
          status: "TODO",
          required: true,
          requires: { photos: true },
        },
      ],
    });

    const tool = buildPixdriftRegistry().getTool("get_vehicle_case");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/store a case/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/tyra/cases/:id" });

    const result = await tool!.handler(runtime(), { id: "case-1" });
    expect(getCaseWorkCard).toHaveBeenCalledWith({}, actor.orgRef, "case-1");
    expect(createTyraCase).not.toHaveBeenCalled();
    expect(result).toEqual({
      case: {
        caseId: "case-1",
        customerId: "cust-1",
        customerName: "Anna Andersson",
        vehicleId: "veh-1",
        registrationNumber: "ABC123",
        make: "Volvo",
        model: "XC60",
        caseStatus: "IN_PROGRESS",
        storageCode: "A-04",
        wheelSetId: "ws-1",
        headline: "VOLVO XC60 — ABC123",
        summary: "Hjulskifte från lager · Tvätt",
        nextBestAction: { title: "Nästa: Hämta hjul", stepKind: "FETCH_WHEELS" },
        steps: [{ kind: "FETCH_WHEELS", title: "Hämta hjul", status: "TODO", required: true }],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/0701234567|anna@example.com|Kund hämtar|photos/);
  });

  it("returns not_found when the case is missing", async () => {
    getCaseWorkCard.mockResolvedValue(null);
    const tool = buildPixdriftRegistry().getTool("get_vehicle_case");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(createTyraCase).not.toHaveBeenCalled();
  });
});
