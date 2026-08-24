import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import {
  DEMO_DOCUMENT_HTTP_REASON,
  DEMO_DOCUMENT_MISSING_REASON,
  NO_DOCUMENTS_REASON,
  buildEngineRequest,
  demoDocumentRequest,
} from "./request.ts";
import { findingsFromAnalysis } from "./findings.ts";
import { resolveRitaEngine, ritaEngineUnavailableReason } from "./resolve-engine.ts";

export interface Analysis {
  id: string;
  orgRef: string;
  companyName: string;
  orgNumber: string;
  status: string;
  blockedReason: string | null;
  result: unknown;
  createdAt: string;
}

export async function requestAnalysis(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  companyName: string;
  orgNumber: string;
  requestId: string;
  useDemoDocument?: boolean;
}): Promise<Analysis> {
  const id = randomUUID();
  await input.pool.query(
    `insert into rita.analyses (id, org_ref, company_name, org_number, status)
     values ($1,$2,$3,$4,'requested')`,
    [id, input.orgRef, input.companyName, input.orgNumber],
  );
  await input.events.publish({
    system: "rita",
    kind: "rita.analysis.requested",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `rita:analysis:${id}`,
    requestId: input.requestId,
    payload: { companyName: input.companyName },
  });

  const resolved = resolveRitaEngine();
  if (!resolved) {
    return fail(input, id, "engine_unavailable", ritaEngineUnavailableReason());
  }

  if (input.useDemoDocument && resolved.kind === "http") {
    return fail(input, id, "demo_document_local_only", DEMO_DOCUMENT_HTTP_REASON);
  }

  const demoDocument = input.useDemoDocument ? demoDocumentRequest() : null;
  if (input.useDemoDocument && !demoDocument) {
    return fail(input, id, "demo_document_missing", DEMO_DOCUMENT_MISSING_REASON);
  }
  const documents = demoDocument ? [demoDocument] : [];
  if (documents.length === 0) {
    return fail(input, id, "no_documents", NO_DOCUMENTS_REASON);
  }

  try {
    const envelope = await resolved.engine.analyse(
      buildEngineRequest({
        analysisId: id,
        orgRef: input.orgRef,
        companyName: input.companyName,
        orgNumber: input.orgNumber,
        documents,
      }),
    );
    await input.pool.query(
      `update rita.analyses
          set status = 'completed', result = $2::jsonb, updated_at = now()
        where id = $1`,
      [id, JSON.stringify(envelope)],
    );
    const findings = findingsFromAnalysis(envelope);
    await input.events.publish({
      system: "rita",
      kind: "rita.analysis.completed",
      orgRef: input.orgRef,
      actorKind: "system",
      subjectRef: `rita:analysis:${id}`,
      requestId: input.requestId,
      payload: {
        analysisId: id,
        companyName: input.companyName,
        findingCount: findings.length,
        modelConfigured: envelope.model_configured === true,
      },
    });
    return (await getAnalysis(input.pool, input.orgRef, id))!;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "engine_failed";
    return fail(input, id, "engine_failed", reason);
  }
}

async function fail(
  input: { pool: pg.Pool; events: EventLog; orgRef: string; requestId: string },
  id: string,
  code: string,
  reason: string,
): Promise<Analysis> {
  await input.pool.query(
    `update rita.analyses
        set status = 'blocked', blocked_reason = $2, updated_at = now()
      where id = $1`,
    [id, reason],
  );
  await input.events.publish({
    system: "rita",
    kind: "rita.analysis.blocked",
    orgRef: input.orgRef,
    actorKind: "system",
    subjectRef: `rita:analysis:${id}`,
    requestId: input.requestId,
    payload: { reason: code },
  });
  return (await getAnalysis(input.pool, input.orgRef, id))!;
}

export const ANALYSIS_STATUS_LABELS: Record<string, string> = {
  requested: "Begärd",
  completed: "Klar",
  blocked: "Blockerad",
};

export async function listAnalyses(
  pool: pg.Pool,
  orgRef: string,
  filter: { status?: string } = {},
): Promise<Analysis[]> {
  const { rows } = await pool.query(
    `select id, org_ref, company_name, org_number, status, blocked_reason, result, created_at
       from rita.analyses
      where org_ref = $1
        and ($2::text is null or status = $2)
      order by created_at desc`,
    [orgRef, filter.status ?? null],
  );
  return rows.map(toAnalysis);
}

export async function getAnalysis(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<Analysis | null> {
  const { rows } = await pool.query(
    `select id, org_ref, company_name, org_number, status, blocked_reason, result, created_at
       from rita.analyses where id = $1 and org_ref = $2`,
    [id, orgRef],
  );
  return rows[0] ? toAnalysis(rows[0]) : null;
}

function toAnalysis(row: {
  id: string;
  org_ref: string;
  company_name: string;
  org_number: string;
  status: string;
  blocked_reason: string | null;
  result: unknown;
  created_at: Date;
}): Analysis {
  return {
    id: row.id,
    orgRef: row.org_ref,
    companyName: row.company_name,
    orgNumber: row.org_number,
    status: row.status,
    blockedReason: row.blocked_reason,
    result: row.result,
    createdAt: new Date(row.created_at).toISOString(),
  };
}
