import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { railAccount } from "./chart.ts";
import { postJournal } from "./journal.ts";
import { getInvoice, invoiceStatusAfterPayment, remainingOre } from "./invoices.ts";
import { assertOre } from "./money.ts";
import { railSnapshot, type PaymentRail } from "./rails.ts";

export const PAYMENT_RAILS = ["swish", "stripe", "invoice_10", "revolut"] as const;

export interface Payment {
  id: string;
  invoiceId: string;
  rail: PaymentRail;
  status: "offered" | "received" | "blocked" | "failed";
  amountOre: number;
  currency: string;
  externalRef: string | null;
  receivedAt: string | null;
  transactionId: string | null;
  note: string | null;
  createdAt: string;
}

function toPayment(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    invoiceId: String(row.invoice_id),
    rail: row.rail as PaymentRail,
    status: row.status as Payment["status"],
    amountOre: Number(row.amount_ore),
    currency: String(row.currency),
    externalRef: row.external_ref ? String(row.external_ref) : null,
    receivedAt: row.received_at ? new Date(String(row.received_at)).toISOString() : null,
    transactionId: row.transaction_id ? String(row.transaction_id) : null,
    note: row.note ? String(row.note) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export function parseRail(value: unknown): PaymentRail {
  if (typeof value === "string" && (PAYMENT_RAILS as readonly string[]).includes(value)) {
    return value as PaymentRail;
  }
  throw new Error("spår måste vara swish, stripe, invoice_10 eller revolut.");
}

export async function listPayments(
  pool: pg.Pool,
  orgRef: string,
  invoiceId?: string,
): Promise<Payment[]> {
  const { rows } = invoiceId
    ? await pool.query(
        `select * from ekonomi.payments where org_ref = $1 and invoice_id = $2 order by created_at desc`,
        [orgRef, invoiceId],
      )
    : await pool.query(
        `select * from ekonomi.payments where org_ref = $1 order by created_at desc`,
        [orgRef],
      );
  return rows.map(toPayment);
}

export async function offerPayment(input: {
  pool: pg.Pool;
  orgRef: string;
  invoiceId: string;
  rail: PaymentRail;
  amountOre?: number;
}): Promise<Payment> {
  const invoice = await getInvoice(input.pool, input.orgRef, input.invoiceId);
  if (!invoice) throw new Error("The invoice does not exist.");
  if (invoice.status !== "issued" && invoice.status !== "part_paid") {
    throw new Error("bara utfärdade fakturor kan få en betalning.");
  }
  const amount = assertOre(input.amountOre ?? remainingOre(invoice), "betalning");
  if (amount === 0 || amount > remainingOre(invoice)) {
    throw new Error("beloppet passar inte kvarvarande skuld.");
  }
  const rail = railSnapshot()[input.rail];
  const status = rail.offerable ? "offered" : "blocked";
  const id = randomUUID();
  await input.pool.query(
    `insert into ekonomi.payments
       (id, org_ref, invoice_id, rail, status, amount_ore, note)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.orgRef, invoice.id, input.rail, status, amount, rail.offerable ? null : rail.reason],
  );
  const { rows } = await input.pool.query(
    `select * from ekonomi.payments where org_ref = $1 and id = $2`,
    [input.orgRef, id],
  );
  return toPayment(rows[0]);
}

export async function recordReceivedPayment(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  invoiceId: string;
  rail: PaymentRail;
  amountOre: number;
  externalRef?: string;
  requestId: string;
}): Promise<Payment> {
  const invoice = await getInvoice(input.pool, input.orgRef, input.invoiceId);
  if (!invoice) throw new Error("The invoice does not exist.");
  if (invoice.status !== "issued" && invoice.status !== "part_paid") {
    throw new Error("fakturan tar inte emot betalning i den här statusen.");
  }
  const amount = assertOre(input.amountOre, "inbetalt");
  if (amount === 0) throw new Error("inbetalt belopp saknas.");
  const nextStatus = invoiceStatusAfterPayment(invoice, amount);
  const posted = await postJournal({
    pool: input.pool,
    orgRef: input.orgRef,
    template: "RECORD_PAYMENT",
    description: `Inbetalt ${invoice.number} via ${input.rail}`,
    lines: [
      { account: railAccount(input.rail), debitOre: amount, creditOre: 0 },
      { account: "1510", debitOre: 0, creditOre: amount },
    ],
    sourceSystem: "ekonomi",
    sourceRef: invoice.id,
  });
  const id = randomUUID();
  await input.pool.query(
    `insert into ekonomi.payments
       (id, org_ref, invoice_id, rail, status, amount_ore, external_ref, received_at, transaction_id)
     values ($1,$2,$3,$4,'received',$5,$6,now(),$7)`,
    [
      id,
      input.orgRef,
      invoice.id,
      input.rail,
      amount,
      input.externalRef?.trim() || null,
      posted.id,
    ],
  );
  await input.pool.query(
    `update ekonomi.invoices
        set paid_ore = paid_ore + $3, status = $4
      where org_ref = $1 and id = $2`,
    [input.orgRef, invoice.id, amount, nextStatus],
  );
  await input.events.publish({
    system: "ekonomi",
    kind: "ekonomi.payment.recorded",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:invoice:${invoice.id}`,
    requestId: input.requestId,
    payload: {
      title: invoice.number,
      rail: input.rail,
      amountOre: amount,
      transactionId: posted.id,
    },
  });
  const { rows } = await input.pool.query(
    `select * from ekonomi.payments where org_ref = $1 and id = $2`,
    [input.orgRef, id],
  );
  return toPayment(rows[0]);
}
