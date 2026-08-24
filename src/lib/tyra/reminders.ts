import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";

export type ReminderKind = "season" | "law" | "pickup";
export type ReminderChannel = "sms" | "email" | "letter";
export type ReminderStatus = "PENDING" | "SENT" | "FAILED" | "CANCELLED" | "BLOCKED";

export type ReminderMessage = {
  subject: string;
  body: string;
};

export function buildReminderMessage(input: {
  kind: ReminderKind;
  targetSeason?: "winter" | "summer";
  customerName?: string | null;
  registrationNumber: string;
  make?: string | null;
  model?: string | null;
  senderName: string;
  daysLeft?: number;
}): ReminderMessage {
  const name = input.customerName?.trim() || "Hej";
  const car = [input.make, input.model].filter(Boolean).join(" ").trim();
  const vehicle = car ? `${input.registrationNumber} (${car})` : input.registrationNumber;
  const sender = input.senderName.trim() || "Verkstaden";

  if (input.kind === "pickup") {
    return {
      subject: `Påminnelse: hjul kvar hos verkstaden (${input.registrationNumber})`,
      body: `${name}!\n\nVi har ett hjulset kvar hos oss för ${vehicle}.\nHör av dig så löser vi utlämning eller hur du vill göra.\n\n/ ${sender}`,
    };
  }
  if (input.kind === "season" && input.targetSeason === "winter") {
    return {
      subject: `Påminnelse: dags att byta till vinterhjul (${input.registrationNumber})`,
      body: `${name}!\n\nDet börjar bli dags att byta till vinterhjul för ${vehicle}.\nVill du att vi bokar en tid och förbereder hjulen?\n\n/ ${sender}`,
    };
  }
  if (input.kind === "season" && input.targetSeason === "summer") {
    return {
      subject: `Påminnelse: dags att byta till sommarhjul (${input.registrationNumber})`,
      body: `${name}!\n\nDet börjar bli dags att byta till sommarhjul för ${vehicle}.\nVill du att vi bokar en tid och förbereder hjulen?\n\n/ ${sender}`,
    };
  }
  if (input.kind === "law" && input.targetSeason === "winter") {
    const left = input.daysLeft != null ? ` Det är ${input.daysLeft} dagar kvar.` : "";
    return {
      subject: `Viktigt: vinterdäck närmar sig (${input.registrationNumber})`,
      body: `${name}!\n\nFör ${vehicle} verkar du inte ha vinterhjul monterade just nu.${left}\nBehöver du hjälp att byta i tid? Svara på detta meddelande eller boka en tid.\n\n/ ${sender}`,
    };
  }
  return {
    subject: `Påminnelse (${input.registrationNumber})`,
    body: `${name}!\n\nPåminnelse för ${vehicle}.\n\n/ ${sender}`,
  };
}

export function chooseChannel(input: {
  phone?: string | null;
  email?: string | null;
}): { channel: ReminderChannel; recipient: string } | null {
  const phone = input.phone?.trim() || null;
  if (phone) return { channel: "sms", recipient: phone };
  const email = input.email?.trim() || null;
  if (email) return { channel: "email", recipient: email };
  return null;
}

export interface OutboxRow {
  id: string;
  orgRef: string;
  channel: ReminderChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: ReminderStatus;
  lastError: string | null;
  createdAt: string;
}

export async function listOutbox(pool: pg.Pool, orgRef: string): Promise<OutboxRow[]> {
  const { rows } = await pool.query<{
    id: string;
    org_ref: string;
    channel: string;
    recipient: string;
    subject: string | null;
    body: string;
    status: string;
    last_error: string | null;
    created_at: Date;
  }>(
    `select id, org_ref, channel, recipient, subject, body, status, last_error, created_at
       from tyra.reminder_outbox
      where org_ref = $1
      order by created_at desc
      limit 100`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    orgRef: row.org_ref,
    channel: row.channel as ReminderChannel,
    recipient: row.recipient,
    subject: row.subject,
    body: row.body,
    status: row.status as ReminderStatus,
    lastError: row.last_error,
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function enqueueReminder(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  customerId?: string | null;
  vehicleId?: string | null;
  reminderKey: string;
  channel: ReminderChannel;
  recipient: string;
  subject: string;
  body: string;
  requestId: string;
}): Promise<{ id: string; status: ReminderStatus }> {
  if (/\btyra\b/i.test(input.body) || /\btyra\b/i.test(input.subject)) {
    throw new Error("Kundtext får inte innehålla Tyra.");
  }
  const id = randomUUID();
  const deliveryId = randomUUID();
  const client = await input.pool.connect();
  try {
    await client.query("begin");
    const existing = await client.query<{ id: string }>(
      `select id from tyra.reminder_deliveries
        where org_ref = $1 and vehicle_id is not distinct from $2 and reminder_key = $3
        limit 1`,
      [input.orgRef, input.vehicleId ?? null, input.reminderKey],
    );
    if (existing.rows[0]) {
      const prior = await client.query<{ outbox_id: string | null; status: string }>(
        `select d.outbox_id, o.status
           from tyra.reminder_deliveries d
           left join tyra.reminder_outbox o on o.id = d.outbox_id
          where d.id = $1`,
        [existing.rows[0].id],
      );
      await client.query("rollback");
      return {
        id: prior.rows[0]?.outbox_id ?? existing.rows[0].id,
        status: (prior.rows[0]?.status as ReminderStatus) ?? "PENDING",
      };
    }
    await client.query(
      `insert into tyra.reminder_outbox (
         id, org_ref, customer_id, vehicle_id, channel, recipient, subject, body, status
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,'PENDING')`,
      [
        id,
        input.orgRef,
        input.customerId ?? null,
        input.vehicleId ?? null,
        input.channel,
        input.recipient,
        input.subject,
        input.body,
      ],
    );
    await client.query(
      `insert into tyra.reminder_deliveries (
         id, org_ref, customer_id, vehicle_id, reminder_key, outbox_id
       ) values ($1,$2,$3,$4,$5,$6)`,
      [
        deliveryId,
        input.orgRef,
        input.customerId ?? null,
        input.vehicleId ?? null,
        input.reminderKey,
        id,
      ],
    );
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }

  await input.events.publish({
    system: "tyra",
    kind: "tyra.reminder.enqueued",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `tyra:outbox:${id}`,
    requestId: input.requestId,
    payload: { channel: input.channel, reminderKey: input.reminderKey },
  });
  return { id, status: "PENDING" };
}

export function deliveryVendorConfigured(): boolean {
  return Boolean(process.env.ELKS_API_USER || process.env.RESEND_API_KEY);
}

export async function processDueOutbox(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef?: string;
  requestId: string;
}): Promise<{ blocked: number; skipped: number }> {
  const reason = deliveryVendorConfigured()
    ? "Leverantörsnyckel finns, men sändadaptern är inte implementerad i navet. Raden skickas inte."
    : "Ingen SMS- eller e-postleverantör är kopplad. Raden skickas inte.";
  const { rows } = await input.pool.query<{ id: string; org_ref: string }>(
    input.orgRef
      ? `select id, org_ref from tyra.reminder_outbox
          where status = 'PENDING' and org_ref = $1
          order by created_at asc limit 100`
      : `select id, org_ref from tyra.reminder_outbox
          where status = 'PENDING'
          order by created_at asc limit 100`,
    input.orgRef ? [input.orgRef] : [],
  );
  let blocked = 0;
  for (const row of rows) {
    const updated = await input.pool.query(
      `update tyra.reminder_outbox
          set status = 'BLOCKED', last_error = $2
        where id = $1 and status = 'PENDING'`,
      [row.id, reason],
    );
    if ((updated.rowCount ?? 0) === 0) continue;
    blocked += 1;
    await input.events.publish({
      system: "tyra",
      kind: "tyra.reminder.blocked",
      orgRef: row.org_ref,
      subjectRef: `tyra:outbox:${row.id}`,
      requestId: `${input.requestId}:${row.id}`,
      payload: { reason: "no_delivery_adapter" },
    });
  }
  return { blocked, skipped: 0 };
}
