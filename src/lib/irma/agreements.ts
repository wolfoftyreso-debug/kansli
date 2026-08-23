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
  const tokenHash = createHash("sha256").update(token).digest("hex");
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
    magicLink: token,
  };
}

function toAgreement(row: {
  id: string;
  title: string;
  counterparty: string;
  status: string;
  created_at: Date;
}): Agreement {
  return {
    id: row.id,
    title: row.title,
    counterparty: row.counterparty,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
