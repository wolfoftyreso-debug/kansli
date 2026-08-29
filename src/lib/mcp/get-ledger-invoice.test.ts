import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@pixdrift/api-core";

const getInvoice = vi.fn();
const listPayments = vi.fn();
const issueInvoice = vi.fn();
const recordReceivedPayment = vi.fn();

vi.mock("@/lib/ekonomi/invoices", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ekonomi/invoices")>();
  return {
    ...actual,
    getInvoice: (...args: unknown[]) => getInvoice(...args),
    issueInvoice: (...args: unknown[]) => issueInvoice(...args),
  };
});

vi.mock("@/lib/ekonomi/payments", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ekonomi/payments")>();
  return {
    ...actual,
    listPayments: (...args: unknown[]) => listPayments(...args),
    recordReceivedPayment: (...args: unknown[]) => recordReceivedPayment(...args),
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
    requestId: "inv-1",
    actor,
    pool: {},
    events: { publish: vi.fn() },
    locale: "en",
    clientId: "test",
    source: "session" as const,
  };
}

describe("MCP get_ledger_invoice", () => {
  beforeEach(() => {
    getInvoice.mockReset();
    listPayments.mockReset();
    issueInvoice.mockReset();
    recordReceivedPayment.mockReset();
  });

  it("returns identity fields, lines and payments without the journal", async () => {
    getInvoice.mockResolvedValue({
      id: "inv-1",
      number: "INV-2026-0010",
      status: "issued",
      customerName: "Anna Test",
      customerRef: "cust-1",
      currency: "SEK",
      netOre: 80_000,
      vatOre: 20_000,
      grossOre: 100_000,
      paidOre: 0,
      dueAt: "2026-09-07T00:00:00.000Z",
      issuedAt: "2026-08-28T00:00:00.000Z",
      sourceSystem: "tyra",
      sourceRef: "quote-1",
      issueTransactionId: "txn-secret",
      attachmentText: "Pixdrift år 1, del 1 av 10",
      createdAt: "2026-08-28T00:00:00.000Z",
      lines: [
        {
          id: "line-1",
          description: "Däck + montering",
          quantity: 1,
          unitNetOre: 80_000,
          vatRateBps: 2500,
          kind: "service",
          netOre: 80_000,
          vatOre: 20_000,
          grossOre: 100_000,
        },
      ],
    });
    listPayments.mockResolvedValue([
      {
        id: "pay-1",
        invoiceId: "inv-1",
        rail: "invoice_10",
        status: "offered",
        amountOre: 100_000,
        currency: "SEK",
        externalRef: "ext-secret",
        receivedAt: null,
        transactionId: "pay-txn-secret",
        note: "journal note",
        createdAt: "2026-08-28T00:00:00.000Z",
      },
    ]);

    const tool = buildPixdriftRegistry().getTool("get_ledger_invoice");
    expect(tool?.sideEffects).toBe("none");
    expect(tool?.whenNotToUse).toMatch(/issue or pay/i);
    expect(tool?.rest).toEqual({ method: "GET", path: "/api/ekonomi/invoices/:id" });

    const result = await tool!.handler(runtime(), { id: "inv-1" });
    expect(getInvoice).toHaveBeenCalledWith({}, actor.orgRef, "inv-1");
    expect(listPayments).toHaveBeenCalledWith({}, actor.orgRef, "inv-1");
    expect(issueInvoice).not.toHaveBeenCalled();
    expect(recordReceivedPayment).not.toHaveBeenCalled();
    expect(result).toEqual({
      invoice: {
        id: "inv-1",
        number: "INV-2026-0010",
        status: "issued",
        customerName: "Anna Test",
        currency: "SEK",
        netOre: 80_000,
        vatOre: 20_000,
        grossOre: 100_000,
        paidOre: 0,
        dueAt: "2026-09-07T00:00:00.000Z",
        issuedAt: "2026-08-28T00:00:00.000Z",
        createdAt: "2026-08-28T00:00:00.000Z",
        lines: [
          {
            id: "line-1",
            description: "Däck + montering",
            quantity: 1,
            unitNetOre: 80_000,
            vatRateBps: 2500,
            kind: "service",
            netOre: 80_000,
            vatOre: 20_000,
            grossOre: 100_000,
          },
        ],
      },
      payments: [
        {
          id: "pay-1",
          rail: "invoice_10",
          status: "offered",
          amountOre: 100_000,
          currency: "SEK",
          receivedAt: null,
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(/txn-secret|ext-secret|pay-txn-secret|journal note/);
    expect(JSON.stringify(result)).not.toMatch(/Pixdrift år 1|issueTransactionId|attachmentText/);
  });

  it("returns not_found when the invoice is missing", async () => {
    getInvoice.mockResolvedValue(null);
    const tool = buildPixdriftRegistry().getTool("get_ledger_invoice");
    expect(await tool!.handler(runtime(), { id: "missing" })).toEqual({ error: "not_found" });
    expect(listPayments).not.toHaveBeenCalled();
    expect(issueInvoice).not.toHaveBeenCalled();
  });
});
