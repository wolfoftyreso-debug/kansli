import { randomUUID } from "node:crypto";
import type pg from "pg";

export const PROTOCOL_CHECKS = [
  "Oljud reproducerbart",
  "Varningslampa tänd",
  "Provkörning genomförd",
  "Felkoder lästa",
  "Visuell kontroll genomförd",
] as const;

export type ObservationValue = "yes" | "no" | "unknown";

export interface ProtocolObservation {
  id: string;
  label: string;
  value: string;
  recordedByRef: string;
  recordedAt: string;
}

export interface ProtocolMeasurement {
  id: string;
  name: string;
  value: number;
  unit: string;
  recordedByRef: string;
  recordedAt: string;
}

export function parseObservationValue(value: unknown): ObservationValue {
  if (value === "yes" || value === "no" || value === "unknown") return value;
  return "unknown";
}

export async function listProtocolObservations(
  pool: pg.Pool,
  orgRef: string,
  caseId: string,
): Promise<ProtocolObservation[]> {
  const { rows } = await pool.query<{
    id: string;
    label: string;
    value: string;
    recorded_by_ref: string;
    recorded_at: Date;
  }>(
    `select id, label, value, recorded_by_ref, recorded_at
       from alva.case_observations
      where org_ref = $1 and case_id = $2
      order by recorded_at desc`,
    [orgRef, caseId],
  );
  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    value: row.value,
    recordedByRef: row.recorded_by_ref,
    recordedAt: new Date(row.recorded_at).toISOString(),
  }));
}

export async function recordProtocolObservation(input: {
  pool: pg.Pool;
  orgRef: string;
  actorRef: string;
  caseId: string;
  label: string;
  value: string;
}): Promise<ProtocolObservation> {
  const owned = await input.pool.query(
    `select id from alva.cases where org_ref = $1 and id = $2 limit 1`,
    [input.orgRef, input.caseId],
  );
  if (!owned.rows[0]) throw new Error("Fallet saknas.");
  const label = input.label.trim();
  if (!label) throw new Error("Observation kräver en etikett.");
  const value = parseObservationValue(input.value);
  const id = randomUUID();
  const recordedAt = new Date().toISOString();
  await input.pool.query(
    `insert into alva.case_observations
       (id, org_ref, case_id, label, value, recorded_by_ref)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, input.orgRef, input.caseId, label, value, input.actorRef],
  );
  await input.pool.query(
    `update alva.cases set updated_at = now() where org_ref = $1 and id = $2`,
    [input.orgRef, input.caseId],
  );
  return {
    id,
    label,
    value,
    recordedByRef: input.actorRef,
    recordedAt,
  };
}

export async function listProtocolMeasurements(
  pool: pg.Pool,
  orgRef: string,
  caseId: string,
): Promise<ProtocolMeasurement[]> {
  const { rows } = await pool.query<{
    id: string;
    name: string;
    value: string;
    unit: string;
    recorded_by_ref: string;
    recorded_at: Date;
  }>(
    `select id, name, value::text, unit, recorded_by_ref, recorded_at
       from alva.case_measurements
      where org_ref = $1 and case_id = $2
      order by recorded_at desc`,
    [orgRef, caseId],
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    value: Number(row.value),
    unit: row.unit,
    recordedByRef: row.recorded_by_ref,
    recordedAt: new Date(row.recorded_at).toISOString(),
  }));
}

export async function recordProtocolMeasurement(input: {
  pool: pg.Pool;
  orgRef: string;
  actorRef: string;
  caseId: string;
  name: string;
  value: number;
  unit: string;
}): Promise<ProtocolMeasurement> {
  const owned = await input.pool.query(
    `select id from alva.cases where org_ref = $1 and id = $2 limit 1`,
    [input.orgRef, input.caseId],
  );
  if (!owned.rows[0]) throw new Error("Fallet saknas.");
  const name = input.name.trim();
  const unit = input.unit.trim();
  if (!name || !unit) throw new Error("Mätning kräver namn och enhet.");
  if (!Number.isFinite(input.value)) throw new Error("Mätvärde krävs.");
  const id = randomUUID();
  const recordedAt = new Date().toISOString();
  await input.pool.query(
    `insert into alva.case_measurements
       (id, org_ref, case_id, name, value, unit, recorded_by_ref)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.orgRef, input.caseId, name, input.value, unit, input.actorRef],
  );
  await input.pool.query(
    `update alva.cases set updated_at = now() where org_ref = $1 and id = $2`,
    [input.orgRef, input.caseId],
  );
  return {
    id,
    name,
    value: input.value,
    unit,
    recordedByRef: input.actorRef,
    recordedAt,
  };
}

export function buildProtocolFacts(input: {
  item: {
    id: string;
    complaint: string;
    vehicleRef: string | null;
    area: string | null;
    mileageKm: number | null;
    desiredOutcome: string | null;
    technicianNotes: string;
    status: string;
  };
  observations: ProtocolObservation[];
  measurements: ProtocolMeasurement[];
}): Record<string, unknown> {
  return {
    system: "alva",
    kind: "protocol-facts",
    diagnosis: null,
    diagnosisEngine: null,
    case: {
      id: input.item.id,
      complaint: input.item.complaint,
      vehicleRef: input.item.vehicleRef,
      area: input.item.area,
      mileageKm: input.item.mileageKm,
      desiredOutcome: input.item.desiredOutcome,
      technicianNotes: input.item.technicianNotes,
      status: input.item.status,
    },
    observations: input.observations.map((row) => ({
      label: row.label,
      value: row.value,
      recordedAt: row.recordedAt,
    })),
    measurements: input.measurements.map((row) => ({
      name: row.name,
      value: row.value,
      unit: row.unit,
      recordedAt: row.recordedAt,
    })),
  };
}

export function observationValueLabel(value: string): string {
  if (value === "yes") return "Ja";
  if (value === "no") return "Nej";
  return "Okänt";
}
