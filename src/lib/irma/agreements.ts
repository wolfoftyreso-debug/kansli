import { createHash, randomBytes, randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";

export interface Agreement {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  createdAt: string;
  magicLink?: string;
}

export function hashIrmaToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function irmaLinkPath(token: string): string {
  return `/irma/l/${token}`;
}

export async function listAgreements(pool: pg.Pool, orgRef: string): Promise<Agreement[]> {
  const { rows } = await pool.query(
    `select id, title, counterparty, status, created_at from irma.agreements
      where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toAgreement);
}

export async function createAgreement(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  title: string;
  counterparty: string;
  requestId: string;
}): Promise<Agreement> {
  const id = randomUUID();
  const token = randomBytes(24).toString("base64url");
  const tokenHash = hashIrmaToken(token);
  await input.pool.query(
    `insert into irma.agreements (id, org_ref, title, counterparty, status, token_hash)
     values ($1,$2,$3,$4,'draft',$5)`,
    [id, input.orgRef, input.title.trim(), input.counterparty.trim(), tokenHash],
  );
  await input.events.publish({
    system: "irma",
    kind: "irma.agreement.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `irma:agreement:${id}`,
    requestId: input.requestId,
    payload: { title: input.title.trim() },
  });
  return {
    id,
    title: input.title.trim(),
    counterparty: input.counterparty.trim(),
    status: "draft",
    createdAt: new Date().toISOString(),
    magicLink: irmaLinkPath(token),
  };
}

/**
 * Counterparty opens the hashed token. First successful open moves draft → viewed
 * and publishes. The token itself is never stored.
 */
export async function openAgreementByToken(input: {
  pool: pg.Pool;
  events: EventLog;
  token: string;
  requestId: string;
}): Promise<Agreement | null> {
  const token = input.token.trim();
  if (!token) return null;
  const { rows } = await input.pool.query(
    `select id, org_ref, title, counterparty, status, created_at
       from irma.agreements where token_hash = $1`,
    [hashIrmaToken(token)],
  );
  const row = rows[0] as
    | {
        id: string;
        org_ref: string;
        title: string;
        counterparty: string;
        status: string;
        created_at: Date;
      }
    | undefined;
  if (!row) return null;

  if (row.status === "draft") {
    await input.pool.query(`update irma.agreements set status = 'viewed' where id = $1`, [row.id]);
    row.status = "viewed";
    await input.events.publish({
      system: "irma",
      kind: "irma.agreement.viewed",
      orgRef: row.org_ref,
      actorKind: "system",
      subjectRef: `irma:agreement:${row.id}`,
      requestId: input.requestId,
      payload: { title: row.title },
    });
  }

  return toAgreement(row);
}

function toAgreement(row: {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  created_at: Date | string;
}): Agreement {
  return {
    id: row.id,
    title: row.title,
    counterparty: row.counterparty,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
