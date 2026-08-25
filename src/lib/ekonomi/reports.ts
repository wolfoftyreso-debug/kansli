import type pg from "pg";
import { CHART } from "./chart.ts";
import { listInvoices, type Invoice } from "./invoices.ts";
import { formatSek, vatLabel } from "./money.ts";

export interface VatBucket {
  rateBps: number;
  netOre: number;
  vatOre: number;
}

export function vatReport(invoices: Invoice[], from: Date, to: Date): VatBucket[] {
  const buckets = new Map<number, VatBucket>();
  for (const invoice of invoices) {
    if (invoice.status === "draft" || invoice.status === "void") continue;
    if (!invoice.issuedAt) continue;
    const issued = new Date(invoice.issuedAt);
    if (issued < from || issued > to) continue;
    for (const line of invoice.lines) {
      const current = buckets.get(line.vatRateBps) ?? {
        rateBps: line.vatRateBps,
        netOre: 0,
        vatOre: 0,
      };
      current.netOre += line.netOre;
      current.vatOre += line.vatOre;
      buckets.set(line.vatRateBps, current);
    }
  }
  return [...buckets.values()].sort((a, b) => b.rateBps - a.rateBps);
}

export function agedReceivables(invoices: Invoice[], now = new Date()) {
  const open = invoices.filter(
    (invoice) => invoice.status === "issued" || invoice.status === "part_paid",
  );
  const notDue = open.filter((invoice) => !invoice.dueAt || new Date(invoice.dueAt) >= now);
  const overdue = open.filter((invoice) => invoice.dueAt && new Date(invoice.dueAt) < now);
  return {
    openCount: open.length,
    notDueOre: notDue.reduce((sum, invoice) => sum + (invoice.grossOre - invoice.paidOre), 0),
    overdueOre: overdue.reduce((sum, invoice) => sum + (invoice.grossOre - invoice.paidOre), 0),
    overdue,
    notDue,
  };
}

export function invoiceDocument(invoice: Invoice, orgName: string): string {
  const lines = invoice.lines
    .map(
      (line) =>
        `${line.description} × ${line.quantity}  ${formatSek(line.netOre)}  moms ${vatLabel(line.vatRateBps)}  ${formatSek(line.grossOre)}`,
    )
    .join("\n");
  return [
    `FAKTURA ${invoice.number}`,
    orgName,
    `Kund: ${invoice.customerName}`,
    `Status: ${invoice.status}`,
    invoice.dueAt ? `Förfaller: ${invoice.dueAt.slice(0, 10)}` : "Förfaller: —",
    "",
    lines,
    "",
    `Netto ${formatSek(invoice.netOre)}`,
    `Moms ${formatSek(invoice.vatOre)}`,
    `Att betala ${formatSek(invoice.grossOre)}`,
    `Inbetalt ${formatSek(invoice.paidOre)}`,
    invoice.sourceSystem ? `Källa: ${invoice.sourceSystem} ${invoice.sourceRef ?? ""}` : "",
  ]
    .filter((row) => row !== "")
    .join("\n");
}

export function vatCsv(buckets: VatBucket[]): string {
  const header = "momssats,netto_ore,moms_ore";
  const rows = buckets.map((bucket) => `${bucket.rateBps},${bucket.netOre},${bucket.vatOre}`);
  return [header, ...rows].join("\n");
}

export async function journalCsv(pool: pg.Pool, orgRef: string): Promise<string> {
  const { rows } = await pool.query(
    `select t.created_at, t.id, t.template, t.description, e.account_code, e.debit_ore, e.credit_ore
       from ekonomi.transactions t
       join ekonomi.entries e on e.transaction_id = t.id
      where t.org_ref = $1
      order by t.created_at, e.account_code`,
    [orgRef],
  );
  const header = "tid,verifikat,mall,beskrivning,konto,debet_ore,kredit_ore";
  const body = rows.map(
    (row) =>
      `${new Date(row.created_at).toISOString()},${row.id},${row.template},${JSON.stringify(row.description)},${row.account_code},${row.debit_ore},${row.credit_ore}`,
  );
  return [header, ...body].join("\n");
}

export function chartLegend(): string {
  return CHART.map((account) => `${account.code} ${account.name}`).join("\n");
}
