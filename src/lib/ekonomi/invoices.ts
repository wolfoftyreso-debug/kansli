import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { salesAccount, vatAccount } from "./chart.ts";
import { postJournal, type JournalLine } from "./journal.ts";
import {
  assertOre,
  lineTotals,
  parseKronorToOre,
  parseVatRateBps,
  type VatRateBps,
} from "./money.ts";
import { notifySaleIssued } from "./sales-alerts.ts";

export const INVOICE_STATUSES = ["draft", "issued", "part_paid", "paid", "void"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Utkast",
  issued: "Utfärdad",
  part_paid: "Delbetald",
  paid: "Betald",
  void: "Makulerad",
};

export interface InvoiceLineInput {
  description: string;
  quantity: number;
  unitNetOre: number;
  vatRateBps: VatRateBps;
  kind: "service" | "goods";
}

export interface InvoiceLine extends InvoiceLineInput {
  id: string;
  netOre: number;
  vatOre: number;
  grossOre: number;
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  customerName: string;
  customerRef: string | null;
  currency: string;
  netOre: number;
  vatOre: number;
  grossOre: number;
  paidOre: number;
  dueAt: string | null;
  issuedAt: string | null;
  sourceSystem: string | null;
  sourceRef: string | null;
  issueTransactionId: string | null;
  createdAt: string;
  lines: InvoiceLine[];
}

function toInvoice(row: Record<string, unknown>, lines: InvoiceLine[]): Invoice {
  return {
    id: String(row.id),
    number: String(row.number),
    status: row.status as InvoiceStatus,
    customerName: String(row.customer_name),
    customerRef: row.customer_ref ? String(row.customer_ref) : null,
    currency: String(row.currency),
    netOre: Number(row.net_ore),
    vatOre: Number(row.vat_ore),
    grossOre: Number(row.gross_ore),
    paidOre: Number(row.paid_ore),
    dueAt: row.due_at ? new Date(String(row.due_at)).toISOString() : null,
    issuedAt: row.issued_at ? new Date(String(row.issued_at)).toISOString() : null,
    sourceSystem: row.source_system ? String(row.source_system) : null,
    sourceRef: row.source_ref ? String(row.source_ref) : null,
    issueTransactionId: row.issue_transaction_id ? String(row.issue_transaction_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    lines,
  };
}

async function loadLines(pool: pg.Pool, orgRef: string, invoiceId: string): Promise<InvoiceLine[]> {
  const { rows } = await pool.query(
    `select id, description, quantity, unit_net_ore, vat_rate_bps, kind, net_ore, vat_ore, gross_ore
       from ekonomi.invoice_lines
      where org_ref = $1 and invoice_id = $2
      order by description`,
    [orgRef, invoiceId],
  );
  return rows.map((row) => ({
    id: row.id,
    description: row.description,
    quantity: Number(row.quantity),
    unitNetOre: Number(row.unit_net_ore),
    vatRateBps: Number(row.vat_rate_bps) as VatRateBps,
    kind: row.kind,
    netOre: Number(row.net_ore),
    vatOre: Number(row.vat_ore),
    grossOre: Number(row.gross_ore),
  }));
}

export function parseLineKind(value: unknown): "service" | "goods" {
  if (value === "goods" || value === "service") return value;
  throw new Error("radslag måste vara service eller goods.");
}

export function buildLines(raw: InvoiceLineInput[]): InvoiceLine[] {
  if (raw.length === 0) throw new Error("faktura utan rader.");
  return raw.map((line) => {
    const description = line.description.trim();
    if (!description) throw new Error("radbeskrivning saknas.");
    const totals = lineTotals({
      quantity: line.quantity,
      unitNetOre: line.unitNetOre,
      vatRateBps: line.vatRateBps,
    });
    salesAccount(line.kind, line.vatRateBps);
    return {
      id: randomUUID(),
      description,
      quantity: line.quantity,
      unitNetOre: line.unitNetOre,
      vatRateBps: line.vatRateBps,
      kind: line.kind,
      ...totals,
    };
  });
}

export function invoiceTotals(lines: InvoiceLine[]): {
  netOre: number;
  vatOre: number;
  grossOre: number;
} {
  return lines.reduce(
    (sum, line) => ({
      netOre: sum.netOre + line.netOre,
      vatOre: sum.vatOre + line.vatOre,
      grossOre: sum.grossOre + line.grossOre,
    }),
    { netOre: 0, vatOre: 0, grossOre: 0 },
  );
}

export function issueLinesToJournal(lines: InvoiceLine[]): JournalLine[] {
  const byAccount = new Map<string, number>();
  let gross = 0;
  for (const line of lines) {
    const sales = salesAccount(line.kind, line.vatRateBps);
    byAccount.set(sales, (byAccount.get(sales) ?? 0) + line.netOre);
    const vat = vatAccount(line.vatRateBps);
    if (vat) byAccount.set(vat, (byAccount.get(vat) ?? 0) + line.vatOre);
    gross += line.grossOre;
  }
  const journal: JournalLine[] = [
    { account: "1510", debitOre: assertOre(gross, "brutto"), creditOre: 0 },
  ];
  for (const [account, ore] of [...byAccount.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (ore === 0) continue;
    journal.push({ account, debitOre: 0, creditOre: ore });
  }
  return journal;
}

async function nextNumber(pool: pg.Pool, orgRef: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const { rows } = await pool.query<{ n: string }>(
    `select count(*)::text as n from ekonomi.invoices
      where org_ref = $1 and number like $2`,
    [orgRef, `INV-${year}-%`],
  );
  const seq = String(Number(rows[0]?.n ?? 0) + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

export async function createDraftInvoice(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  customerName: string;
  customerRef?: string;
  lines: InvoiceLineInput[];
  sourceSystem?: string;
  sourceRef?: string;
  requestId: string;
}): Promise<Invoice> {
  const customerName = input.customerName.trim();
  if (!customerName) throw new Error("kundnamn krävs.");
  const lines = buildLines(input.lines);
  const totals = invoiceTotals(lines);
  const id = randomUUID();
  const number = await nextNumber(input.pool, input.orgRef);
  await input.pool.query(
    `insert into ekonomi.invoices
       (id, org_ref, number, status, customer_name, customer_ref,
        net_ore, vat_ore, gross_ore, source_system, source_ref)
     values ($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      input.orgRef,
      number,
      customerName,
      input.customerRef?.trim() || null,
      totals.netOre,
      totals.vatOre,
      totals.grossOre,
      input.sourceSystem ?? null,
      input.sourceRef ?? null,
    ],
  );
  for (const line of lines) {
    await input.pool.query(
      `insert into ekonomi.invoice_lines
         (id, org_ref, invoice_id, description, quantity, unit_net_ore,
          vat_rate_bps, kind, net_ore, vat_ore, gross_ore)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        line.id,
        input.orgRef,
        id,
        line.description,
        line.quantity,
        line.unitNetOre,
        line.vatRateBps,
        line.kind,
        line.netOre,
        line.vatOre,
        line.grossOre,
      ],
    );
  }
  await input.events.publish({
    system: "ekonomi",
    kind: "ekonomi.invoice.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:invoice:${id}`,
    requestId: input.requestId,
    payload: { title: number, customerName, grossOre: totals.grossOre },
  });
  return (await getInvoice(input.pool, input.orgRef, id))!;
}

export async function issueInvoice(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  invoiceId: string;
  dueDays?: number;
  requestId: string;
}): Promise<Invoice> {
  const invoice = await getInvoice(input.pool, input.orgRef, input.invoiceId);
  if (!invoice) throw new Error("fakturan finns inte.");
  if (invoice.status !== "draft") throw new Error("bara utkast kan utfärdas.");
  const days = input.dueDays ?? 10;
  if (!Number.isInteger(days) || days < 1)
    throw new Error("förfallodagar måste vara ett heltal ≥ 1.");
  const posted = await postJournal({
    pool: input.pool,
    orgRef: input.orgRef,
    template: "ISSUE_INVOICE",
    description: `Utfärdad ${invoice.number}`,
    lines: issueLinesToJournal(invoice.lines),
    sourceSystem: invoice.sourceSystem,
    sourceRef: invoice.id,
  });
  const due = new Date(Date.now() + days * 86_400_000);
  await input.pool.query(
    `update ekonomi.invoices
        set status = 'issued',
            issued_at = now(),
            due_at = $3,
            issue_transaction_id = $4
      where org_ref = $1 and id = $2`,
    [input.orgRef, invoice.id, due.toISOString(), posted.id],
  );
  await input.events.publish({
    system: "ekonomi",
    kind: "ekonomi.invoice.issued",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:invoice:${invoice.id}`,
    requestId: input.requestId,
    payload: { title: invoice.number, dueDays: days, transactionId: posted.id },
  });
  const issued = (await getInvoice(input.pool, input.orgRef, invoice.id))!;
  try {
    await notifySaleIssued({
      pool: input.pool,
      events: input.events,
      orgRef: input.orgRef,
      actorRef: input.actorRef,
      invoiceId: issued.id,
      invoiceNumber: issued.number,
      customerName: issued.customerName,
      grossOre: issued.grossOre,
      requestId: input.requestId,
    });
  } catch {
    // A missed SMS must not roll back a booked sale.
  }
  return issued;
}

export async function findInvoiceBySource(
  pool: pg.Pool,
  orgRef: string,
  sourceSystem: string,
  sourceRef: string,
): Promise<Invoice | null> {
  const { rows } = await pool.query(
    `select * from ekonomi.invoices
      where org_ref = $1 and source_system = $2 and source_ref = $3
      order by created_at asc
      limit 1`,
    [orgRef, sourceSystem, sourceRef],
  );
  if (!rows[0]) return null;
  return toInvoice(rows[0], await loadLines(pool, orgRef, rows[0].id));
}

/** Draft then issue. A missed SMS still cannot roll this back. */
export async function bookSale(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  customerName: string;
  customerRef?: string;
  lines: InvoiceLineInput[];
  sourceSystem?: string;
  sourceRef?: string;
  dueDays?: number;
  requestId: string;
}): Promise<Invoice> {
  if (input.sourceSystem && input.sourceRef) {
    const existing = await findInvoiceBySource(
      input.pool,
      input.orgRef,
      input.sourceSystem,
      input.sourceRef,
    );
    if (existing) throw new Error("sälj med samma källa är redan bokat.");
  }
  const draft = await createDraftInvoice({
    pool: input.pool,
    events: input.events,
    orgRef: input.orgRef,
    actorRef: input.actorRef,
    customerName: input.customerName,
    customerRef: input.customerRef,
    lines: input.lines,
    sourceSystem: input.sourceSystem,
    sourceRef: input.sourceRef,
    requestId: input.requestId,
  });
  return issueInvoice({
    pool: input.pool,
    events: input.events,
    orgRef: input.orgRef,
    actorRef: input.actorRef,
    invoiceId: draft.id,
    dueDays: input.dueDays,
    requestId: `${input.requestId}-issue`,
  });
}

export async function listInvoices(pool: pg.Pool, orgRef: string): Promise<Invoice[]> {
  const { rows } = await pool.query(
    `select * from ekonomi.invoices where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  const out: Invoice[] = [];
  for (const row of rows) {
    out.push(toInvoice(row, await loadLines(pool, orgRef, row.id)));
  }
  return out;
}

export async function getInvoice(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<Invoice | null> {
  const { rows } = await pool.query(
    `select * from ekonomi.invoices where org_ref = $1 and id = $2 limit 1`,
    [orgRef, id],
  );
  if (!rows[0]) return null;
  return toInvoice(rows[0], await loadLines(pool, orgRef, id));
}

export function parseInvoiceLinesFromForm(form: {
  descriptions: string[];
  quantities: string[];
  unitNetOre?: string[];
  unitNetKronor?: string[];
  vatRates: string[];
  kinds: string[];
}): InvoiceLineInput[] {
  const lines: InvoiceLineInput[] = [];
  for (let i = 0; i < form.descriptions.length; i += 1) {
    const description = form.descriptions[i]?.trim() ?? "";
    if (!description) continue;
    const kronor = form.unitNetKronor?.[i]?.trim() ?? "";
    const oreRaw = form.unitNetOre?.[i]?.trim() ?? "";
    let unitNetOre: number;
    if (kronor) {
      unitNetOre = parseKronorToOre(kronor, "á-pris");
    } else if (oreRaw) {
      unitNetOre = Number(oreRaw);
      if (!Number.isInteger(unitNetOre)) {
        throw new Error("á-pris i öre måste vara ett heltal.");
      }
    } else {
      throw new Error("á-pris saknas.");
    }
    lines.push({
      description,
      quantity: Number(form.quantities[i] ?? "1"),
      unitNetOre,
      vatRateBps: parseVatRateBps(form.vatRates[i]),
      kind: parseLineKind(form.kinds[i] ?? "service"),
    });
  }
  return lines;
}

export function remainingOre(invoice: Invoice): number {
  return invoice.grossOre - invoice.paidOre;
}

export function invoiceStatusAfterPayment(invoice: Invoice, incomingOre: number): InvoiceStatus {
  const paid = invoice.paidOre + incomingOre;
  if (paid > invoice.grossOre) throw new Error("betalningen överstiger kvarvarande belopp.");
  if (paid === invoice.grossOre) return "paid";
  return "part_paid";
}
