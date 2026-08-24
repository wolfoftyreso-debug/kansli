import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";

export const CASE_STATUSES = ["open", "in_progress", "closed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  open: "Öppet",
  in_progress: "Pågår",
  closed: "Stängt",
};

export function parseCaseStatus(value: unknown): CaseStatus | null {
  if (typeof value === "string" && (CASE_STATUSES as readonly string[]).includes(value)) {
    return value as CaseStatus;
  }
  return null;
}

export interface DiagnosisCase {
  id: string;
  complaint: string;
  vehicleRef: string | null;
  area: string | null;
  mileageKm: number | null;
  desiredOutcome: string | null;
  technicianNotes: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function listCases(pool: pg.Pool, orgRef: string): Promise<DiagnosisCase[]> {
  const { rows } = await pool.query(
    `select id, complaint, vehicle_ref, area, mileage_km, desired_outcome,
            technician_notes, status, created_at, updated_at
       from alva.cases
      where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toCase);
}

export async function getCase(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<DiagnosisCase | null> {
  const { rows } = await pool.query(
    `select id, complaint, vehicle_ref, area, mileage_km, desired_outcome,
            technician_notes, status, created_at, updated_at
       from alva.cases
      where org_ref = $1 and id = $2 limit 1`,
    [orgRef, id],
  );
  return rows[0] ? toCase(rows[0]) : null;
}

export async function createCase(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  complaint: string;
  vehicleRef?: string;
  area?: string;
  mileageKm?: number;
  desiredOutcome?: string;
  requestId: string;
}): Promise<DiagnosisCase> {
  const id = randomUUID();
  const complaint = input.complaint.trim();
  const vehicleRef = input.vehicleRef?.trim() || null;
  const area = input.area?.trim() || null;
  const mileageKm = Number.isFinite(input.mileageKm) ? input.mileageKm! : null;
  const desiredOutcome = input.desiredOutcome?.trim() || null;
  await input.pool.query(
    `insert into alva.cases
       (id, org_ref, complaint, vehicle_ref, area, mileage_km, desired_outcome, status)
     values ($1,$2,$3,$4,$5,$6,$7,'open')`,
    [id, input.orgRef, complaint, vehicleRef, area, mileageKm, desiredOutcome],
  );
  await input.events.publish({
    system: "alva",
    kind: "alva.case.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `alva:case:${id}`,
    requestId: input.requestId,
    payload: {
      note: "Diagnosmotorn anländer med ALVA-repot. Fallet är registrerat.",
      caseId: id,
      complaintExcerpt: complaint.slice(0, 120),
      vehicleRef,
      area,
    },
  });
  return {
    id,
    complaint,
    vehicleRef,
    area,
    mileageKm,
    desiredOutcome,
    technicianNotes: "",
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function setCaseStatus(input: {
  pool: pg.Pool;
  orgRef: string;
  caseId: string;
  status: CaseStatus;
}): Promise<void> {
  const updated = await input.pool.query(
    `update alva.cases
        set status = $3, updated_at = now()
      where org_ref = $1 and id = $2`,
    [input.orgRef, input.caseId, input.status],
  );
  if ((updated.rowCount ?? 0) === 0) throw new Error("Fallet saknas.");
}

export async function setCaseNotes(input: {
  pool: pg.Pool;
  orgRef: string;
  caseId: string;
  notes: string;
}): Promise<void> {
  const updated = await input.pool.query(
    `update alva.cases
        set technician_notes = $3, updated_at = now()
      where org_ref = $1 and id = $2`,
    [input.orgRef, input.caseId, input.notes.trim() || null],
  );
  if ((updated.rowCount ?? 0) === 0) throw new Error("Fallet saknas.");
}

function toCase(row: {
  id: string;
  complaint: string;
  vehicle_ref: string | null;
  area?: string | null;
  mileage_km?: number | null;
  desired_outcome?: string | null;
  technician_notes?: string | null;
  status: string;
  created_at: Date;
  updated_at?: Date | null;
}): DiagnosisCase {
  return {
    id: row.id,
    complaint: row.complaint,
    vehicleRef: row.vehicle_ref,
    area: row.area ?? null,
    mileageKm: row.mileage_km ?? null,
    desiredOutcome: row.desired_outcome ?? null,
    technicianNotes: row.technician_notes ?? "",
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at ?? row.created_at).toISOString(),
  };
}
