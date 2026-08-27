import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { normalizeDomain } from "../platform/webintel.ts";

/**
 * MAJ — Mät, analysera, justera. A project is one domain in one market with
 * one business goal. The user configures almost nothing; the system discovers.
 */

export const MAJ_GOALS = ["customers", "rank", "competitors", "authority", "all"] as const;
export type MajGoal = (typeof MAJ_GOALS)[number];

export const MAJ_GOAL_LABELS: Record<MajGoal, string> = {
  customers: "Få fler kunder",
  rank: "Ranka högre på Google",
  competitors: "Slå mina konkurrenter",
  authority: "Bygga ämnesauktoritet",
  all: "Allt ovan",
};

export const MAJ_POSTURES = ["conservative", "balanced", "aggressive", "hedge"] as const;
export type MajPosture = (typeof MAJ_POSTURES)[number];

export const MAJ_POSTURE_LABELS: Record<MajPosture, string> = {
  conservative: "Conservative",
  balanced: "Balanced",
  aggressive: "Aggressive",
  hedge: "HEDGE",
};

export function parseGoal(value: unknown): MajGoal | null {
  return typeof value === "string" && (MAJ_GOALS as readonly string[]).includes(value)
    ? (value as MajGoal)
    : null;
}

export function parsePosture(value: unknown): MajPosture | null {
  return typeof value === "string" && (MAJ_POSTURES as readonly string[]).includes(value)
    ? (value as MajPosture)
    : null;
}

export interface MajProject {
  id: string;
  domain: string;
  market: string;
  language: string;
  goal: MajGoal;
  posture: MajPosture;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const COLUMNS = "id, domain, market, language, goal, posture, status, created_at, updated_at";

export async function createProject(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  actorRef: string;
  domain: string;
  market?: string;
  language?: string;
  goal: MajGoal;
  requestId: string;
}): Promise<MajProject> {
  const domain = normalizeDomain(input.domain);
  if (!domain) throw new Error("Domänen går inte att använda.");
  const market = (input.market?.trim() || "SE").toUpperCase().slice(0, 2);
  const language = (input.language?.trim() || "sv").toLowerCase().slice(0, 2);
  const id = randomUUID();
  const { rows } = await input.pool.query(
    `insert into maj.projects (id, org_ref, domain, market, language, goal)
     values ($1,$2,$3,$4,$5,$6)
     returning ${COLUMNS}`,
    [id, input.orgRef, domain, market, language, input.goal],
  );
  await input.events.publish({
    system: "maj",
    kind: "maj.project.created",
    orgRef: input.orgRef,
    actorKind: "user",
    actorRef: input.actorRef,
    subjectRef: `maj:project:${id}`,
    requestId: input.requestId,
    payload: { title: `${domain} — nytt MAJ-projekt`, domain, market, language, goal: input.goal },
  });
  return toProject(rows[0]!);
}

export async function listProjects(pool: pg.Pool, orgRef: string): Promise<MajProject[]> {
  const { rows } = await pool.query(
    `select ${COLUMNS} from maj.projects where org_ref = $1 order by created_at desc`,
    [orgRef],
  );
  return rows.map(toProject);
}

export async function getProject(
  pool: pg.Pool,
  orgRef: string,
  id: string,
): Promise<MajProject | null> {
  const { rows } = await pool.query(
    `select ${COLUMNS} from maj.projects where org_ref = $1 and id = $2 limit 1`,
    [orgRef, id],
  );
  return rows[0] ? toProject(rows[0]) : null;
}

export async function setPosture(
  pool: pg.Pool,
  orgRef: string,
  id: string,
  posture: MajPosture,
): Promise<void> {
  await pool.query(
    `update maj.projects set posture = $3, updated_at = now() where org_ref = $1 and id = $2`,
    [orgRef, id, posture],
  );
}

function toProject(row: Record<string, unknown>): MajProject {
  return {
    id: String(row.id),
    domain: String(row.domain),
    market: String(row.market),
    language: String(row.language),
    goal: parseGoal(row.goal) ?? "all",
    posture: parsePosture(row.posture) ?? "balanced",
    status: String(row.status),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}
