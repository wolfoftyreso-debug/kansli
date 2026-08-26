import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { isHouseSession } from "../kansli/intakes.ts";
import { DEMO_METRICS, evaluateMetrics, type FindingDraft, type MetricFacts } from "./engine.ts";

export function canRunDemoIntel(orgRef: string): boolean {
  return isHouseSession(orgRef);
}

export interface MetricSnapshot {
  id: string;
  period: string;
  revenue: number;
  planRevenue: number;
  cash: number;
  monthlyBurn: number;
  topCustomerShare: number;
  createdAt: string;
}

export interface StoredFinding {
  id: string;
  runId: string;
  fingerprint: string;
  severity: string;
  category: string;
  title: string;
  body: string;
  evidence: Array<{ label: string; value: string }>;
  createdAt: string;
}

export interface AnalysisRun {
  id: string;
  status: string;
  findingCount: number;
  createdAt: string;
}

export async function listSnapshots(pool: pg.Pool, orgRef: string): Promise<MetricSnapshot[]> {
  const { rows } = await pool.query(
    `select id, period, revenue, plan_revenue, cash, monthly_burn, top_customer_share, created_at
       from britt.metric_snapshots where org_ref = $1 order by created_at desc limit 12`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    period: row.period,
    revenue: Number(row.revenue),
    planRevenue: Number(row.plan_revenue),
    cash: Number(row.cash),
    monthlyBurn: Number(row.monthly_burn),
    topCustomerShare: Number(row.top_customer_share),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function listFindings(pool: pg.Pool, orgRef: string): Promise<StoredFinding[]> {
  const { rows } = await pool.query(
    `select id, run_id, fingerprint, severity, category, title, body, evidence, created_at
       from britt.findings where org_ref = $1 order by created_at desc limit 50`,
    [orgRef],
  );
  return rows.map(toFinding);
}

export async function listRuns(pool: pg.Pool, orgRef: string): Promise<AnalysisRun[]> {
  const { rows } = await pool.query(
    `select id, status, finding_count, created_at
       from britt.analysis_runs where org_ref = $1 order by created_at desc limit 10`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    findingCount: Number(row.finding_count),
    createdAt: new Date(row.created_at).toISOString(),
  }));
}

export async function runIntel(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  requestId: string;
  facts?: MetricFacts;
}): Promise<{ run: AnalysisRun; findings: StoredFinding[]; snapshot: MetricSnapshot }> {
  if (!input.facts && !canRunDemoIntel(input.orgRef)) {
    throw new Error("Demonstrationssiffror körs bara på huset.");
  }
  const facts = input.facts ?? DEMO_METRICS;
  const drafts = evaluateMetrics(facts);
  const snapshotId = randomUUID();
  const runId = randomUUID();

  await input.pool.query(
    `insert into britt.metric_snapshots
       (id, org_ref, period, revenue, plan_revenue, cash, monthly_burn, top_customer_share)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      snapshotId,
      input.orgRef,
      facts.period,
      facts.revenue,
      facts.planRevenue,
      facts.cash,
      facts.monthlyBurn,
      facts.topCustomerShare,
    ],
  );

  await input.pool.query(
    `insert into britt.analysis_runs (id, org_ref, status, finding_count)
     values ($1,$2,'completed',$3)`,
    [runId, input.orgRef, drafts.length],
  );

  const findings: StoredFinding[] = [];
  for (const draft of drafts) {
    const stored = await insertFinding(input.pool, input.orgRef, runId, draft);
    findings.push(stored);
    await input.events.publish({
      system: "britt",
      kind: "britt.finding.recorded",
      orgRef: input.orgRef,
      actorKind: "user",
      actorRef: input.actorRef,
      subjectRef: `britt:finding:${stored.id}`,
      requestId: input.requestId,
      payload: {
        title: stored.title,
        severity: stored.severity,
        fingerprint: stored.fingerprint,
      },
    });
  }

  return {
    run: {
      id: runId,
      status: "completed",
      findingCount: findings.length,
      createdAt: new Date().toISOString(),
    },
    findings,
    snapshot: {
      id: snapshotId,
      period: facts.period,
      revenue: facts.revenue,
      planRevenue: facts.planRevenue,
      cash: facts.cash,
      monthlyBurn: facts.monthlyBurn,
      topCustomerShare: facts.topCustomerShare,
      createdAt: new Date().toISOString(),
    },
  };
}

async function insertFinding(
  pool: pg.Pool,
  orgRef: string,
  runId: string,
  draft: FindingDraft,
): Promise<StoredFinding> {
  const id = randomUUID();
  await pool.query(
    `insert into britt.findings
       (id, org_ref, run_id, fingerprint, severity, category, title, body, evidence)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
    [
      id,
      orgRef,
      runId,
      draft.fingerprint,
      draft.severity,
      draft.category,
      draft.title,
      draft.body,
      JSON.stringify(draft.evidence),
    ],
  );
  return {
    id,
    runId,
    fingerprint: draft.fingerprint,
    severity: draft.severity,
    category: draft.category,
    title: draft.title,
    body: draft.body,
    evidence: draft.evidence,
    createdAt: new Date().toISOString(),
  };
}

function toFinding(row: {
  id: string;
  run_id: string;
  fingerprint: string;
  severity: string;
  category: string;
  title: string;
  body: string;
  evidence: unknown;
  created_at: Date;
}): StoredFinding {
  return {
    id: row.id,
    runId: row.run_id,
    fingerprint: row.fingerprint,
    severity: row.severity,
    category: row.category,
    title: row.title,
    body: row.body,
    evidence: Array.isArray(row.evidence)
      ? (row.evidence as Array<{ label: string; value: string }>)
      : [],
    createdAt: new Date(row.created_at).toISOString(),
  };
}
