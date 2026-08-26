import { describe, expect, it } from "vitest";
import type { Invoice } from "./invoices.ts";
import type { Payment } from "./payments.ts";
import {
  buildDailyLedger,
  formatChartDay,
  formatChartRange,
  formatSekCompact,
  periodSummary,
  periodWindow,
  previousWindow,
  sliceLedger,
  stockholmDay,
} from "./series.ts";

function invoice(
  issuedAt: string,
  grossOre: number,
  status: Invoice["status"] = "issued",
): Invoice {
  return {
    id: issuedAt,
    number: issuedAt,
    status,
    customerName: "Holm AB",
    customerRef: null,
    currency: "SEK",
    netOre: grossOre,
    vatOre: 0,
    grossOre,
    paidOre: 0,
    dueAt: null,
    issuedAt,
    sourceSystem: null,
    sourceRef: null,
    issueTransactionId: null,
    attachmentText: null,
    createdAt: issuedAt,
    lines: [],
  };
}

function payment(receivedAt: string, amountOre: number): Payment {
  return {
    id: receivedAt,
    invoiceId: "inv",
    rail: "invoice_10",
    status: "received",
    amountOre,
    currency: "SEK",
    externalRef: null,
    receivedAt,
    transactionId: null,
    note: null,
    createdAt: receivedAt,
  };
}

describe("sales series", () => {
  it("builds a continuous Stockholm-day ledger from issued sales and received cash", () => {
    const now = new Date("2026-08-25T12:00:00+02:00");
    const points = buildDailyLedger(
      [
        invoice("2026-08-23T08:00:00+02:00", 10_000),
        invoice("2026-08-25T09:00:00+02:00", 5_000),
        invoice("2026-08-24T09:00:00+02:00", 1_000, "draft"),
      ],
      [payment("2026-08-24T18:00:00+02:00", 4_000)],
      now,
    );
    expect(points[0]?.date).toBe("2026-08-23");
    expect(points.at(-1)?.date).toBe("2026-08-25");
    expect(points.map((point) => point.salesOre)).toEqual([10_000, 0, 5_000]);
    expect(points.map((point) => point.receivedOre)).toEqual([0, 4_000, 0]);
    expect(points.at(-1)?.salesCumOre).toBe(15_000);
    expect(points.at(-1)?.receivedCumOre).toBe(4_000);
  });

  it("slices a period and compares it to the previous window", () => {
    const now = new Date("2026-08-25T12:00:00+02:00");
    const invoices = Array.from({ length: 20 }, (_, index) =>
      invoice(`2026-08-${String(index + 6).padStart(2, "0")}T10:00:00+02:00`, 1000),
    );
    const all = buildDailyLedger(invoices, [], now);
    const month = sliceLedger(all, "1M");
    expect(month).toHaveLength(30);
    const week = sliceLedger(all, "1W");
    expect(week).toHaveLength(7);
    const zoomed = sliceLedger(all, "1W", 50, 100);
    expect(zoomed.length).toBeLessThan(week.length);
    const previous = previousWindow(all, "1W");
    const summary = periodSummary(week, previous);
    expect(summary.salesOre).toBe(7_000);
    expect(summary.previousSalesOre).toBe(7_000);
    expect(summary.changeOre).toBe(0);
    expect(summary.receivedChangeOre).toBe(0);
  });

  it("pads a month even when the first sale is today", () => {
    const now = new Date("2026-08-25T12:00:00+02:00");
    const all = buildDailyLedger([invoice("2026-08-25T09:00:00+02:00", 5_000)], [], now);
    const month = periodWindow(all, "1M");
    expect(month).toHaveLength(30);
    expect(month[0]?.date).toBe("2026-07-27");
    expect(month[0]?.salesOre).toBe(0);
    expect(month.at(-1)?.date).toBe("2026-08-25");
    expect(month.at(-1)?.salesOre).toBe(5_000);
    expect(month.at(-1)?.salesCumOre).toBe(5_000);
  });

  it("formats compact krona and short Swedish chart dates", () => {
    expect(formatSekCompact(12_500_00)).toBe("12,5 tkr");
    expect(stockholmDay("2026-08-25T23:30:00+02:00")).toBe("2026-08-25");
    expect(formatChartDay("2026-08-25")).toMatch(/25/);
    expect(formatChartDay("2026-08-25")).toMatch(/aug/i);
    expect(formatChartRange("2026-07-27", "2026-08-25")).toMatch(/jul/);
    expect(formatChartRange("2025-08-26", "2026-08-25")).toMatch(/2025/);
    expect(formatChartRange("2025-08-26", "2026-08-25")).toMatch(/2026/);
  });
});
