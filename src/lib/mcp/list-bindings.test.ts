import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const listAgreements = vi.fn();
const listTyraCases = vi.fn();
const listAlvaCases = vi.fn();
const listCreditaeInquiries = vi.fn();

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

vi.mock("@/lib/alva/cases", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/alva/cases")>();
  return {
    ...actual,
    listCases: (...args: unknown[]) => listAlvaCases(...args),
  };
});

vi.mock("@/lib/creditae/inquiries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/creditae/inquiries")>();
  return {
    ...actual,
    listInquiries: (...args: unknown[]) => listCreditaeInquiries(...args),
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
    listAlvaCases.mockReset();
    listCreditaeInquiries.mockReset();
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

  it("lists diagnostic cases without technician notes", async () => {
    listAlvaCases.mockResolvedValue([
      {
        id: "alva-1",
        complaint: "Tickar vid broms",
        vehicleRef: "ABC111",
        area: "brakes",
        mileageKm: 120000,
        desiredOutcome: "Ska stanna tyst",
        technicianNotes: "hemlig anteckning",
        status: "open",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-21T00:00:00.000Z",
      },
    ]);
    const tool = buildPixdriftRegistry().getTool("list_diagnostic_cases");
    expect(tool).toBeTruthy();
    const result = (await tool!.handler(runtime(), { limit: 10 })) as {
      items: Record<string, unknown>[];
    };
    expect(listAlvaCases).toHaveBeenCalledWith({}, actor.orgRef);
    expect(result.items).toEqual([
      {
        id: "alva-1",
        complaint: "Tickar vid broms",
        vehicleRef: "ABC111",
        area: "brakes",
        mileageKm: 120000,
        status: "open",
        createdAt: "2026-08-20T00:00:00.000Z",
        updatedAt: "2026-08-21T00:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(/hemlig|technicianNotes|desiredOutcome/);
  });

  it("lists credit inquiries without bureau scores or traffic numbers", async () => {
    listCreditaeInquiries.mockResolvedValue([
      {
        id: "crd-1",
        subjectOrgNumber: "5560160680",
        subjectName: "Holm",
        subjectDomain: "example.com",
        reason: "avtal",
        status: "assessed",
        assessment: "watch",
        notes: "hemlig bedömning",
        vendorStatus: "fetched",
        providerRef: "cs-1",
        vendorName: "Creditsafe",
        vendorScore: "87",
        vendorLimit: "500000",
        vendorReason: "ok",
        webStatus: "fetched",
        webRank: "12",
        webOrganicKeywords: "40",
        webOrganicTraffic: "900",
        webAdwordsKeywords: "3",
        webReason: null,
        webFetchedAt: "2026-08-28T00:00:00.000Z",
        createdAt: "2026-08-27T00:00:00.000Z",
        updatedAt: "2026-08-28T00:00:00.000Z",
      },
    ]);
    const tool = buildPixdriftRegistry().getTool("list_credit_inquiries");
    expect(tool).toBeTruthy();
    const result = (await tool!.handler(runtime(), { limit: 10 })) as {
      items: Record<string, unknown>[];
    };
    expect(listCreditaeInquiries).toHaveBeenCalledWith({}, actor.orgRef);
    expect(result.items).toEqual([
      {
        id: "crd-1",
        subjectOrgNumber: "5560160680",
        subjectName: "Holm",
        status: "assessed",
        assessment: "watch",
        vendorStatus: "fetched",
        webStatus: "fetched",
        createdAt: "2026-08-27T00:00:00.000Z",
        updatedAt: "2026-08-28T00:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /hemlig|vendorScore|vendorLimit|webRank|webOrganic|Creditsafe|87|500000/,
    );
  });
});
