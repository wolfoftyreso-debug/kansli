import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { normalizeOrgNumber, orgNumberError } from "../platform/org-number.ts";

export const INQUIRY_STATUSES = ["open", "assessed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const ASSESSMENTS = ["go", "watch", "stop"] as const;
export type Assessment = (typeof ASSESSMENTS)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  open: "Öppen",
  assessed: "Bedömd",
};

export const ASSESSMENT_LABELS: Record<Assessment, string> = {
  go: "Kör",
  watch: "Bevaka",
  stop: "Stanna",
};

export function parseInquiryStatus(value: unknown): InquiryStatus | null {
  if (typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value)) {
    return value as InquiryStatus;
  }
  return null;
}

export function parseAssessment(value: unknown): Assessment | null {
  if (typeof value === "string" && (ASSESSMENTS as readonly string[]).includes(value)) {
    return value as Assessment;
  }
  return null;
}

export interface CreditInquiry {
  id: string;
  subjectOrgNumber: string;
  subjectName: string | null;
  reason: string | null;
  status: InquiryStatus;
  assessment: Assessment | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function listInquiries(pool: pg.Pool, orgRef: string): Promise<CreditInquiry[]> {
  const { rows } = await pool.query(
    `select id, subject_org_number, subject_name, reason, status, assessment, notes,
            created_at, updated_at
       from creditae.inquiries
      where org_ref = $1
      order by created_at desc`,
    [orgRef],
  );
  return rows.map(toInquiry);
}

export async function getInquiry(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<CreditInquiry | null> {
  const { rows } = await pool.query(
    `select id, subject_org_number, subject_name, reason, status, assessment, notes,
            created_at, updated_at
       from creditae.inquiries
      where org_ref = $1 and id = $2
      limit 1`,
    [orgRef, id],
  );
  return rows[0] ? toInquiry(rows[0]) : null;
}

export async function createInquiry(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  subjectOrgNumber: string;
  subjectName?: string;
  reason?: string;
  requestId: string;
}): Promise<CreditInquiry> {
  const subjectOrgNumber = normalizeOrgNumber(input.subjectOrgNumber);
  if (!subjectOrgNumber) {
    throw new Error(orgNumberError(input.subjectOrgNumber) ?? "Organisationsnumret stämmer inte.");
  }
  const subjectName = input.subjectName?.trim() || null;
  const reason = input.reason?.trim() || null;
  const id = randomUUID();
  await input.pool.query(
    `insert into creditae.inquiries
       (id, org_ref, subject_org_number, subject_name, reason, status)
     values ($1,$2,$3,$4,$5,'open')`,
    [id, input.orgRef, subjectOrgNumber, subjectName, reason],
  );
  await input.events.publish({
    system: "creditae",
    kind: "creditae.inquiry.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `creditae:inquiry:${id}`,
    requestId: input.requestId,
    payload: {
      note: "Förfrågan är registrerad. CREDITAE sätter inget kreditbetyg.",
      inquiryId: id,
      subjectOrgNumber,
      subjectName,
    },
  });
  return {
    id,
    subjectOrgNumber,
    subjectName,
    reason,
    status: "open",
    assessment: null,
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function recordAssessment(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  inquiryId: string;
  assessment: Assessment;
  notes?: string;
  requestId: string;
}): Promise<CreditInquiry> {
  const notes = input.notes?.trim() || null;
  const updated = await input.pool.query(
    `update creditae.inquiries
        set assessment = $3,
            notes = $4,
            status = 'assessed',
            updated_at = now()
      where org_ref = $1 and id = $2
      returning id, subject_org_number, subject_name, reason, status, assessment, notes,
                created_at, updated_at`,
    [input.orgRef, input.inquiryId, input.assessment, notes],
  );
  if (!updated.rows[0]) throw new Error("Förfrågan saknas.");
  const item = toInquiry(updated.rows[0]);
  await input.events.publish({
    system: "creditae",
    kind: "creditae.assessment.recorded",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `creditae:inquiry:${item.id}`,
    requestId: input.requestId,
    payload: {
      note: "Bedömningen är er, inte ett kreditbetyg från en byrå.",
      inquiryId: item.id,
      subjectOrgNumber: item.subjectOrgNumber,
      assessment: item.assessment,
    },
  });
  return item;
}

function toInquiry(row: {
  id: string;
  subject_org_number: string;
  subject_name: string | null;
  reason: string | null;
  status: string;
  assessment: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date | null;
}): CreditInquiry {
  return {
    id: row.id,
    subjectOrgNumber: row.subject_org_number,
    subjectName: row.subject_name,
    reason: row.reason,
    status: parseInquiryStatus(row.status) ?? "open",
    assessment: parseAssessment(row.assessment),
    notes: row.notes ?? "",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at ?? row.created_at).toISOString(),
  };
}
