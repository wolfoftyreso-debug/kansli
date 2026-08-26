import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { DEFAULT_LOCALE, t, type Locale } from "../i18n/index.ts";
import { creditConfigured, requestCompanyCredit, type CreditReport } from "../platform/credit.ts";
import { normalizeOrgNumber, orgNumberError } from "../platform/org-number.ts";

export const INQUIRY_STATUSES = ["open", "assessed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const ASSESSMENTS = ["go", "watch", "stop"] as const;
export type Assessment = (typeof ASSESSMENTS)[number];

export const VENDOR_STATUSES = ["blocked", "failed", "fetched"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  open: "Open",
  assessed: "Assessed",
};

export const ASSESSMENT_LABELS: Record<Assessment, string> = {
  go: "Go",
  watch: "Watch",
  stop: "Stop",
};

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  blocked: "Credit off",
  failed: "No report",
  fetched: "Report in",
};

export function inquiryStatusLabel(status: InquiryStatus, locale: Locale = DEFAULT_LOCALE): string {
  return t(locale, `creditae.status.${status}`);
}

export function assessmentLabel(value: Assessment, locale: Locale = DEFAULT_LOCALE): string {
  return t(locale, `creditae.assess.${value}`);
}

export function vendorStatusLabel(status: VendorStatus, locale: Locale = DEFAULT_LOCALE): string {
  return t(locale, `creditae.vendor.${status}`);
}

const INQUIRY_COLUMNS = `id, subject_org_number, subject_name, reason, status, assessment, notes,
            vendor_status, provider_ref, vendor_name, vendor_score, vendor_limit, vendor_reason,
            created_at, updated_at`;

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

export function parseVendorStatus(value: unknown): VendorStatus | null {
  if (typeof value === "string" && (VENDOR_STATUSES as readonly string[]).includes(value)) {
    return value as VendorStatus;
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
  vendorStatus: VendorStatus | null;
  providerRef: string | null;
  vendorName: string | null;
  vendorScore: string | null;
  vendorLimit: string | null;
  vendorReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listInquiries(pool: pg.Pool, orgRef: string): Promise<CreditInquiry[]> {
  const { rows } = await pool.query(
    `select ${INQUIRY_COLUMNS}
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
    `select ${INQUIRY_COLUMNS}
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
  fetchImpl?: typeof fetch;
  env?: Record<string, string | undefined>;
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

  const env = input.env ?? process.env;
  const configured = creditConfigured(env);
  let report: CreditReport;
  try {
    report = configured
      ? await requestCompanyCredit({ orgNumber: subjectOrgNumber }, input.fetchImpl ?? fetch, env)
      : {
          ok: false,
          providerRef: null,
          vendorName: null,
          vendorScore: null,
          vendorLimit: null,
          reason: "Ingen kreditbyrå är kopplad. Rapporten hämtas inte.",
        };
  } catch {
    report = {
      ok: false,
      providerRef: null,
      vendorName: null,
      vendorScore: null,
      vendorLimit: null,
      reason: "Kreditbyrån gick inte att nå.",
    };
  }

  const vendorStatus: VendorStatus = !configured ? "blocked" : report.ok ? "fetched" : "failed";
  const vendorReason = report.ok ? null : report.reason;
  await input.pool.query(
    `update creditae.inquiries
        set vendor_status = $3,
            provider_ref = $4,
            vendor_name = $5,
            vendor_score = $6,
            vendor_limit = $7,
            vendor_reason = $8,
            updated_at = now()
      where org_ref = $1 and id = $2`,
    [
      input.orgRef,
      id,
      vendorStatus,
      report.providerRef,
      report.ok ? report.vendorName : null,
      report.ok ? report.vendorScore : null,
      report.ok ? report.vendorLimit : null,
      vendorReason,
    ],
  );

  if (configured) {
    await input.events.publish({
      system: "creditae",
      kind: report.ok ? "creditae.report.fetched" : "creditae.report.failed",
      orgRef: input.orgRef,
      actorKind: "system",
      actorRef: input.actorRef,
      subjectRef: `creditae:inquiry:${id}`,
      requestId: input.requestId,
      payload: {
        note: report.ok
          ? "Byråns rapport är hämtad. CREDITAE sätter inte er slutsats."
          : vendorReason,
        inquiryId: id,
        subjectOrgNumber,
        vendorStatus,
        providerRef: report.providerRef,
        vendorName: report.ok ? report.vendorName : null,
        vendorScore: report.ok ? report.vendorScore : null,
        vendorLimit: report.ok ? report.vendorLimit : null,
      },
    });
  }

  return (
    (await getInquiry(input.pool, input.orgRef, id)) ?? {
      id,
      subjectOrgNumber,
      subjectName,
      reason,
      status: "open",
      assessment: null,
      notes: "",
      vendorStatus,
      providerRef: report.providerRef,
      vendorName: report.ok ? report.vendorName : null,
      vendorScore: report.ok ? report.vendorScore : null,
      vendorLimit: report.ok ? report.vendorLimit : null,
      vendorReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
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
      returning ${INQUIRY_COLUMNS}`,
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
  vendor_status: string | null;
  provider_ref: string | null;
  vendor_name: string | null;
  vendor_score: string | null;
  vendor_limit: string | null;
  vendor_reason: string | null;
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
    vendorStatus: parseVendorStatus(row.vendor_status),
    providerRef: row.provider_ref,
    vendorName: row.vendor_name,
    vendorScore: row.vendor_score,
    vendorLimit: row.vendor_limit,
    vendorReason: row.vendor_reason,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at ?? row.created_at).toISOString(),
  };
}
