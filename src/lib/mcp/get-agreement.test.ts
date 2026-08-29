import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const getAgreement = vi.fn();
const createAgreement = vi.fn();
const revokeAgreement = vi.fn();
const verifyAgreementIntegrity = vi.fn();

vi.mock("@/lib/irma/agreements", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/irma/agreements")>();
  return {
    ...actual,
    getAgreement: (...args: unknown[]) => getAgreement(...args),
    createAgreement: (...args: unknown[]) => createAgreement(...args),
    revokeAgreement: (...args: unknown[]) => revokeAgreement(...args),
  };
});

vi.mock("@/lib/irma/integrity", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/irma/integrity")>();
  return {
    ...actual,
    verifyAgreementIntegrity: (...args: unknown[]) => verifyAgreementIntegrity(...args),
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
    requestId: "irma-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_agreement", () => {
  beforeEach(() => {
    getAgreement.mockReset();
    createAgreement.mockReset();
    revokeAgreement.mockReset();
    verifyAgreementIntegrity.mockReset();
  });

  it("returns identity fields and integrity flags without body, clauses or the guest link", async () => {
    getAgreement.mockResolvedValue({
      id: "agr-1",
      title: "Hyra",
      counterparty: "Anna",
      status: "sent",
      body: "hemlig brödtext",
      clauses: [{ id: "c1", text: "hemlig klausul" }],
      createdAt: "2026-08-01T00:00:00.000Z",
      viewedAt: "2026-08-02T00:00:00.000Z",
      signedAt: null,
      signerName: "ska-inte-med",
      artifactSha256: "abc",
      contentSha256: "def",
      verificationLevel: 0,
      tokenExpiresAt: "2026-08-08T00:00:00.000Z",
      magicLink: "/irma/l/secret",
    });
    verifyAgreementIntegrity.mockReturnValue({ contentMatches: true, artifactMatches: null });

    const tool = buildPixdriftRegistry().getTool("get_agreement");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/create or revoke/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/irma/agreements/:id" });

    const result = await tool!.handler(runtime(), { id: "agr-1" });
    expect(getAgreement).toHaveBeenCalledWith({}, actor.orgRef, "agr-1");
    expect(createAgreement).not.toHaveBeenCalled();
    expect(revokeAgreement).not.toHaveBeenCalled();
    expect(result).toEqual({
      agreement: {
        id: "agr-1",
        title: "Hyra",
        counterparty: "Anna",
        status: "sent",
        createdAt: "2026-08-01T00:00:00.000Z",
        viewedAt: "2026-08-02T00:00:00.000Z",
        signedAt: null,
        verificationLevel: 0,
        tokenExpiresAt: "2026-08-08T00:00:00.000Z",
      },
      integrity: { contentMatches: true, artifactMatches: null },
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|magicLink|signerName|sha256|secret/i);
  });

  it("returns not_found when the agreement is missing", async () => {
    getAgreement.mockResolvedValue(null);
    const tool = buildPixdriftRegistry().getTool("get_agreement");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(verifyAgreementIntegrity).not.toHaveBeenCalled();
    expect(createAgreement).not.toHaveBeenCalled();
    expect(revokeAgreement).not.toHaveBeenCalled();
  });
});
