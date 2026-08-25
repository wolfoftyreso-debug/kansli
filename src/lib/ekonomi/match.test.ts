import { describe, expect, it } from "vitest";
import { matchInbound } from "./match.ts";

const open = [
  { invoiceId: "a", number: "INV-2026-0001", remainingOre: 12500, currency: "SEK" },
  { invoiceId: "b", number: "INV-2026-0002", remainingOre: 12500, currency: "SEK" },
];

describe("matchInbound", () => {
  it("matches on unique amount", () => {
    expect(
      matchInbound(
        {
          providerTxId: "1",
          amountOre: 5000,
          currency: "SEK",
          reference: null,
          bookedAt: "2026-01-01",
        },
        [{ invoiceId: "c", number: "INV-2026-0003", remainingOre: 5000, currency: "SEK" }],
      ),
    ).toEqual({ status: "matched", invoiceId: "c" });
  });

  it("uses invoice number when two amounts collide", () => {
    expect(
      matchInbound(
        {
          providerTxId: "2",
          amountOre: 12500,
          currency: "SEK",
          reference: "betalning INV-2026-0002",
          bookedAt: "2026-01-01",
        },
        open,
      ),
    ).toEqual({ status: "matched", invoiceId: "b" });
  });

  it("refuses to guess when two invoices fit", () => {
    expect(
      matchInbound(
        {
          providerTxId: "3",
          amountOre: 12500,
          currency: "SEK",
          reference: null,
          bookedAt: "2026-01-01",
        },
        open,
      ),
    ).toEqual({ status: "ambiguous", invoiceIds: ["a", "b"] });
  });
});
