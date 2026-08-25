import type { Invoice } from "./invoices.ts";
import type { Payment } from "./payments.ts";

export const PERIODS = [
  { id: "1W", days: 7, label: "1V" },
  { id: "1M", days: 30, label: "1M" },
  { id: "3M", days: 90, label: "3M" },
  { id: "1Y", days: 365, label: "1Å" },
  { id: "MAX", days: null, label: "Max" },
] as const;

export type PeriodId = (typeof PERIODS)[number]["id"];

export interface DayPoint {
  date: string;
  salesOre: number;
  receivedOre: number;
  salesCumOre: number;
  receivedCumOre: number;
}

const STOCKHOLM = "Europe/Stockholm";

export function stockholmDay(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00+02:00`);
  date.setUTCDate(date.getUTCDate() + count);
  return stockholmDay(date);
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

function enumerateDays(from: string, to: string): string[] {
  if (!from || !to || from > to) return [];
  const out: string[] = [];
  let cursor = from;
  for (let i = 0; i <= 800 && cursor <= to; i += 1) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function buildDailyLedger(
  invoices: readonly Invoice[],
  payments: readonly Payment[],
  now = new Date(),
): DayPoint[] {
  const today = stockholmDay(now);
  const sales = new Map<string, number>();
  const received = new Map<string, number>();
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.status === "void" || !invoice.issuedAt) continue;
    const day = stockholmDay(invoice.issuedAt);
    if (!day) continue;
    sales.set(day, (sales.get(day) ?? 0) + invoice.grossOre);
  }
  for (const payment of payments) {
    if (payment.status !== "received") continue;
    const day = stockholmDay(payment.receivedAt ?? payment.createdAt);
    if (!day) continue;
    received.set(day, (received.get(day) ?? 0) + payment.amountOre);
  }
  const keys = [...sales.keys(), ...received.keys()].sort();
  if (keys.length === 0) return [];
  const from = keys[0]!;
  const span = daysBetween(from, today);
  const start = span > 730 ? addDays(today, -730) : from;
  const days = enumerateDays(start, today);
  let salesCum = 0;
  let receivedCum = 0;
  return days.map((date) => {
    const salesOre = sales.get(date) ?? 0;
    const receivedOre = received.get(date) ?? 0;
    salesCum += salesOre;
    receivedCum += receivedOre;
    return { date, salesOre, receivedOre, salesCumOre: salesCum, receivedCumOre: receivedCum };
  });
}

export function sliceLedger(
  points: readonly DayPoint[],
  period: PeriodId,
  startPct = 0,
  endPct = 100,
): DayPoint[] {
  if (points.length === 0) return [];
  const spec = PERIODS.find((item) => item.id === period) ?? PERIODS[1];
  const windowed =
    spec.days == null ? [...points] : points.slice(Math.max(0, points.length - spec.days));
  const lo = Math.min(Math.max(startPct, 0), 99);
  const hi = Math.min(Math.max(endPct, lo + 1), 100);
  const start = Math.floor((windowed.length * lo) / 100);
  const end = Math.max(start + 1, Math.ceil((windowed.length * hi) / 100));
  const slice = windowed.slice(start, end);
  let salesCum = 0;
  let receivedCum = 0;
  return slice.map((point) => {
    salesCum += point.salesOre;
    receivedCum += point.receivedOre;
    return { ...point, salesCumOre: salesCum, receivedCumOre: receivedCum };
  });
}

export function periodSummary(points: readonly DayPoint[], previous: readonly DayPoint[]) {
  const salesOre = points.reduce((sum, point) => sum + point.salesOre, 0);
  const receivedOre = points.reduce((sum, point) => sum + point.receivedOre, 0);
  const previousSalesOre = previous.reduce((sum, point) => sum + point.salesOre, 0);
  const changeOre = salesOre - previousSalesOre;
  const changePct =
    previousSalesOre === 0 ? (salesOre === 0 ? 0 : null) : (changeOre / previousSalesOre) * 100;
  return { salesOre, receivedOre, previousSalesOre, changeOre, changePct };
}

export function previousWindow(points: readonly DayPoint[], period: PeriodId): DayPoint[] {
  if (points.length === 0) return [];
  const spec = PERIODS.find((item) => item.id === period);
  const days = spec?.days ?? Math.ceil(points.length / 2);
  const current = points.slice(Math.max(0, points.length - days));
  const end = points.length - current.length;
  return points.slice(Math.max(0, end - days), end);
}

export function formatSekCompact(ore: number): string {
  const kronor = ore / 100;
  const sign = kronor < 0 ? "−" : "";
  const abs = Math.abs(kronor);
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} mn`;
  if (abs >= 10_000)
    return `${sign}${(abs / 1000).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} tkr`;
  return `${sign}${Math.round(abs).toLocaleString("sv-SE")} kr`;
}
