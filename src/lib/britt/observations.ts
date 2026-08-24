import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";

export interface Observation {
  id: string;
  sourceSystem: string;
  title: string;
  body: string;
  severity: string;
  subjectRef: string | null;
  status: string;
  createdAt: string;
}

export async function listObservations(pool: pg.Pool, orgRef: string): Promise<Observation[]> {
  const { rows } = await pool.query(
    `select id, source_system, title, body, severity, subject_ref, status, created_at
       from britt.observations where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toObservation);
}

export async function setObservationStatus(input: {
  pool: pg.Pool;
  orgRef: string;
  id: string;
  status: "open" | "done";
}): Promise<void> {
  await input.pool.query(
    `update britt.observations set status = $3 where org_ref = $1 and id = $2`,
    [input.orgRef, input.id, input.status],
  );
}

export async function addObservation(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  title: string;
  body: string;
  requestId: string;
}): Promise<Observation> {
  const id = randomUUID();
  await input.pool.query(
    `insert into britt.observations (id, org_ref, source_system, title, body, severity)
     values ($1,$2,'britt',$3,$4,'info')`,
    [id, input.orgRef, input.title.trim(), input.body.trim()],
  );
  await input.events.publish({
    system: "britt",
    kind: "britt.observation.recorded",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `britt:observation:${id}`,
    requestId: input.requestId,
    payload: { title: input.title.trim(), source: "britt" },
  });
  const { rows } = await input.pool.query(
    `select id, source_system, title, body, severity, subject_ref, status, created_at
       from britt.observations where id = $1`,
    [id],
  );
  return toObservation(rows[0]!);
}

function toObservation(row: {
  id: string;
  source_system: string;
  title: string;
  body: string;
  severity: string;
  subject_ref?: string | null;
  status?: string | null;
  created_at: Date;
}): Observation {
  return {
    id: row.id,
    sourceSystem: row.source_system,
    title: row.title,
    body: row.body,
    severity: row.severity,
    subjectRef: row.subject_ref ?? null,
    status: row.status ?? "open",
    createdAt: new Date(row.created_at).toISOString(),
  };
}
