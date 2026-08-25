import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { formatSek } from "./money.ts";
import { normalizeSwedishMobile, salesSmsBody, sendSms, smsConfigured } from "@/lib/platform/sms";

export type AlertStatus = "PENDING" | "SENT" | "FAILED" | "BLOCKED";

export interface SalesAlertSettings {
  phone: string;
  enabled: boolean;
  updatedAt: string;
}

export interface SalesAlertRow {
  id: string;
  invoiceId: string | null;
  recipient: string;
  body: string;
  status: AlertStatus;
  lastError: string | null;
  createdAt: string;
}

export async function getSalesAlertSettings(
  pool: pg.Pool,
  orgRef: string,
): Promise<SalesAlertSettings | null> {
  const { rows } = await pool.query<{ phone: string; enabled: boolean; updated_at: Date }>(
    `select phone, enabled, updated_at from ekonomi.sales_alert_settings where org_ref = $1`,
    [orgRef],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    phone: row.phone,
    enabled: row.enabled,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function saveSalesAlertSettings(input: {
  pool: pg.Pool;
  orgRef: string;
  phone: string;
  enabled: boolean;
}): Promise<SalesAlertSettings> {
  const phone = normalizeSwedishMobile(input.phone);
  if (!phone) throw new Error("Skriv ett svenskt mobilnummer, till exempel 070-123 45 67.");
  await input.pool.query(
    `insert into ekonomi.sales_alert_settings (org_ref, phone, enabled, updated_at)
     values ($1,$2,$3,now())
     on conflict (org_ref) do update set phone = excluded.phone, enabled = excluded.enabled, updated_at = now()`,
    [input.orgRef, phone, input.enabled],
  );
  return (await getSalesAlertSettings(input.pool, input.orgRef))!;
}

export async function listSalesAlerts(pool: pg.Pool, orgRef: string): Promise<SalesAlertRow[]> {
  const { rows } = await pool.query<{
    id: string;
    invoice_id: string | null;
    recipient: string;
    body: string;
    status: AlertStatus;
    last_error: string | null;
    created_at: Date;
  }>(
    `select id, invoice_id, recipient, body, status, last_error, created_at
       from ekonomi.sales_alert_outbox
      where org_ref = $1
      order by created_at desc
      limit 20`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    invoiceId: row.invoice_id,
    recipient: row.recipient,
    body: row.body,
    status: row.status,
    lastError: row.last_error,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function notifySaleIssued(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  grossOre: number;
  requestId: string;
}): Promise<SalesAlertRow | null> {
  const settings = await getSalesAlertSettings(input.pool, input.orgRef);
  if (!settings || !settings.enabled) return null;
  const body = salesSmsBody({
    invoiceNumber: input.invoiceNumber,
    customerName: input.customerName,
    amountLabel: formatSek(input.grossOre),
  });
  const id = randomUUID();
  await input.pool.query(
    `insert into ekonomi.sales_alert_outbox
       (id, org_ref, invoice_id, channel, recipient, body, status)
     values ($1,$2,$3,'sms',$4,$5,'PENDING')`,
    [id, input.orgRef, input.invoiceId, settings.phone, body],
  );
  await input.events.publish({
    system: "ekonomi",
    kind: "ekonomi.sales.alert.enqueued",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:sales-alert:${id}`,
    requestId: input.requestId,
    payload: { invoiceId: input.invoiceId, invoiceNumber: input.invoiceNumber },
  });

  const delivered = smsConfigured()
    ? await sendSms({ to: settings.phone, body })
    : {
        ok: false,
        providerRef: null,
        reason: "Ingen telefonleverantör är kopplad. Meddelandet skickas inte.",
      };
  const status: AlertStatus = delivered.ok ? "SENT" : smsConfigured() ? "FAILED" : "BLOCKED";
  await input.pool.query(
    `update ekonomi.sales_alert_outbox
        set status = $2, last_error = $3, provider_ref = $4
      where id = $1`,
    [id, status, delivered.reason, delivered.providerRef],
  );
  await input.events.publish({
    system: "ekonomi",
    kind:
      status === "SENT"
        ? "ekonomi.sales.alert.sent"
        : status === "BLOCKED"
          ? "ekonomi.sales.alert.blocked"
          : "ekonomi.sales.alert.failed",
    orgRef: input.orgRef,
    actorKind: "integration",
    actorRef: input.actorRef,
    subjectRef: `ekonomi:sales-alert:${id}`,
    requestId: `${input.requestId}:deliver`,
    payload: { status, reason: delivered.reason, invoiceNumber: input.invoiceNumber },
  });
  return {
    id,
    invoiceId: input.invoiceId,
    recipient: settings.phone,
    body,
    status,
    lastError: delivered.reason,
    createdAt: new Date().toISOString(),
  };
}
