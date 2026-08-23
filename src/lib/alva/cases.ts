import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";

export interface DiagnosisCase {
  id: string;
  complaint: string;
  vehicleRef: string | null;
  status: string;
  createdAt: string;
}

export async function listCases(pool: pg.Pool, orgRef: string): Promise<DiagnosisCase[]> {
  const { rows } = await pool.query(
    `select id, complaint, vehicle_ref, status, created_at from alva.cases
      where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toCase);
}

export async function createCase(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  complaint: string;
  vehicleRef?: string;
  requestId: string;
}): Promise<DiagnosisCase> {
  const id = randomUUID();
  await input.pool.query(
    `insert into alva.cases (id, org_ref, complaint, vehicle_ref, status)
     values ($1,$2,$3,$4,'open')`,
    [id, input.orgRef, input.complaint.trim(), input.vehicleRef ?? null],
  );
  await input.events.publish({
    system: "alva",
    kind: "alva.case.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `alva:case:${id}`,
    requestId: input.requestId,
    payload: { note: "Diagnosmotorn anländer med ALVA-repot. Fallet är registrerat." },
  });
  return {
    id,
    complaint: input.complaint.trim(),
    vehicleRef: input.vehicleRef ?? null,
    status: "open",
    createdAt: new Date().toISOString(),
  };
}

function toCase(row: {
  id: string;
  complaint: string;
  vehicle_ref: string | null;
  status: string;
  created_at: Date;
}): DiagnosisCase {
  return {
    id: row.id,
    complaint: row.complaint,
    vehicleRef: row.vehicle_ref,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
