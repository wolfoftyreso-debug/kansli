import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { getAction, type MajAction } from "./engine.ts";

/**
 * Decisions and releases. Approve/decline is the human gate; a completed
 * change is published as a versioned release with a human card and a machine
 * object (`release.v1`) — the same truth for people, systems and learning.
 */

export async function decideAction(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  actionId: string;
  decision: "approved" | "declined";
  requestId: string;
}): Promise<void> {
  const { rowCount } = await input.pool.query(
    `update maj.actions
        set state = $3, decided_at = now(), decided_by = $4
      where org_ref = $1 and id = $2 and state = 'proposed'`,
    [input.orgRef, input.actionId, input.decision, input.actorRef],
  );
  if (!rowCount) throw new Error("Beslutet finns inte eller är redan avgjort.");
  await input.events.publish({
    system: "maj",
    kind: "maj.action.decided",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `maj:action:${input.actionId}`,
    requestId: input.requestId,
    payload: { title: `Beslut: ${input.decision}`, actionId: input.actionId },
  });
}

export interface MajRelease {
  id: string;
  version: string;
  title: string;
  summary: string;
  machine: Record<string, unknown>;
  publishedAt: string;
}

export async function listReleases(
  pool: pg.Pool,
  orgRef: string,
  projectId: string,
): Promise<MajRelease[]> {
  const { rows } = await pool.query(
    `select id, version, title, summary, machine, published_at from maj.releases
      where org_ref = $1 and project_id = $2 order by published_at desc`,
    [orgRef, projectId],
  );
  return rows.map((row) => ({
    id: String(row.id),
    version: String(row.version),
    title: String(row.title),
    summary: String(row.summary),
    machine: (row.machine ?? {}) as Record<string, unknown>,
    publishedAt: new Date(String(row.published_at)).toISOString(),
  }));
}

async function nextVersion(pool: pg.Pool, orgRef: string, projectId: string): Promise<string> {
  const { rows } = await pool.query<{ n: string }>(
    `select count(*)::text as n from maj.releases where org_ref = $1 and project_id = $2`,
    [orgRef, projectId],
  );
  return `maj-1.0.${Number(rows[0]?.n ?? 0) + 1}`;
}

/** release.v1 — additive contract; never break fields, only add. */
export function buildReleaseMachine(input: {
  version: string;
  action: MajAction;
  note: string | null;
}): Record<string, unknown> {
  return {
    contract: "release.v1",
    release_id: input.version,
    trigger: input.action.kind,
    signals: input.action.evidence,
    decisions: [
      {
        action_id: input.action.id,
        title: input.action.title,
        risk: input.action.risk,
        expected_impact: input.action.expectedImpact,
        confidence: input.action.confidence,
        decided_at: input.action.decidedAt,
      },
    ],
    changes: [{ summary: input.note ?? input.action.title }],
    tests: [],
    deployment: { mode: "manual", note: "Utfört utanför MAJ i alfa." },
    rollback: { available: false, note: "Manuell återställning i alfa." },
    measurement_plan: {
      window_days: 28,
      metrics: ["visibility", "clicks", "position"],
      baseline_at: new Date().toISOString(),
    },
  };
}

/**
 * Mark an approved action as done and publish the release. In alpha the
 * change itself is carried out by a human or an external coding agent from
 * the implementation prompt; MAJ records the truth of what happened.
 */
export async function completeAction(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  actionId: string;
  note?: string;
  requestId: string;
}): Promise<MajRelease> {
  const action = await getAction(input.pool, input.orgRef, input.actionId);
  if (!action) throw new Error("Beslutet finns inte.");
  if (action.state !== "approved") throw new Error("Bara godkända beslut kan slutföras.");

  const { rowCount } = await input.pool.query(
    `update maj.actions set state = 'done', decided_at = now(), decided_by = $3
      where org_ref = $1 and id = $2 and state = 'approved'`,
    [input.orgRef, input.actionId, input.actorRef],
  );
  if (!rowCount) throw new Error("Beslutet kunde inte slutföras.");

  const version = await nextVersion(input.pool, input.orgRef, action.projectId);
  const note = input.note?.trim() || null;
  const machine = buildReleaseMachine({ version, action, note });
  const id = randomUUID();
  const summary = note ?? action.why;
  await input.pool.query(
    `insert into maj.releases (id, org_ref, project_id, version, title, summary, machine)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [id, input.orgRef, action.projectId, version, action.title, summary, JSON.stringify(machine)],
  );
  await input.events.publish({
    system: "maj",
    kind: "maj.release.published",
    orgRef: input.orgRef,
    actorKind: "system",
    actorRef: input.actorRef,
    subjectRef: `maj:release:${id}`,
    requestId: input.requestId,
    payload: {
      title: `Search Update ${version.replace("maj-", "")} — ${action.title}`,
      version,
      projectId: action.projectId,
    },
  });
  return {
    id,
    version,
    title: action.title,
    summary,
    machine,
    publishedAt: new Date().toISOString(),
  };
}
