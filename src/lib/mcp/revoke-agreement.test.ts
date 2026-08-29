import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const getAgreement = vi.fn();
const createAgreement = vi.fn();
const revokeAgreement = vi.fn();

vi.mock("@/lib/irma/agreements", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/irma/agreements")>();
  return {
    ...actual,
    getAgreement: (...args: unknown[]) => getAgreement(...args),
    createAgreement: (...args: unknown[]) => createAgreement(...args),
    revokeAgreement: (...args: unknown[]) => revokeAgreement(...args),
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
  permissions: ["document:upload"],
};

function runtime() {
  return {
    requestId: "irma-revoke-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP revoke_agreement", () => {
  beforeEach(() => {
    getAgreement.mockReset();
    createAgreement.mockReset();
    revokeAgreement.mockReset();
  });

  it("returns identity fields after cancel without body, clauses or the guest link", async () => {
    revokeAgreement.mockResolvedValue({
      id: "agr-1",
      title: "Hyra",
      counterparty: "Anna",
      status: "cancelled",
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

    const tool = buildPixdriftRegistry().getTool("revoke_agreement");
    expect(tool?.sideEffects).toBe("write");
    expect(tool?.whenNotToUse).toMatch(/get_agreement/);
    expect(tool?.rest).toEqual({ method: "POST", path: "/api/irma/agreements/:id" });

    const result = await tool!.handler(runtime(), { id: "agr-1" });
    expect(revokeAgreement).toHaveBeenCalledWith({
      pool: {},
      events: expect.anything(),
      orgRef: actor.orgRef,
      id: "agr-1",
      actorRef: actor.sub,
      requestId: "irma-revoke-1",
    });
    expect(createAgreement).not.toHaveBeenCalled();
    expect(result).toEqual({
      agreement: {
        id: "agr-1",
        title: "Hyra",
        counterparty: "Anna",
        status: "cancelled",
        createdAt: "2026-08-01T00:00:00.000Z",
        viewedAt: "2026-08-02T00:00:00.000Z",
        signedAt: null,
      },
    });
    expect(JSON.stringify(result)).not.toMatch(/hemlig|magicLink|signerName|sha256|secret/i);
  });

  it("returns not_found when the agreement is missing", async () => {
    revokeAgreement.mockResolvedValue(null);
    const tool = buildPixdriftRegistry().getTool("revoke_agreement");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(createAgreement).not.toHaveBeenCalled();
  });
});
