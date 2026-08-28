import type pg from "pg";
import { isHardenedRuntime } from "../auth/secrets.ts";
import type { OpsScope } from "./ops-view.ts";
import type {
  OpsDebugHit,
  OpsDebugLookup,
  OpsErrorRow,
  OpsQueueCounts,
  OpsQueues,
  OpsRuntimeDebug,
} from "./ops-debug-view.ts";
import { sanitizePayload } from "./ops-debug-view.ts";

const MIN_QUERY = 3;
const LOOKUP_LIMIT = 30;
const ERROR_LIMIT = 20;

type Queryable = Pick<pg.Pool, "query">;

const emptyCounts = (): OpsQueueCounts => ({
  pending: 0,
  sent: 0,
  failed: 0,
  blocked: 0,
});

function orgWhere(scope: OpsScope, column = "org_ref"): string {
  return scope === "house" ? "" : ` and ${column} = $1`;
}

function orgParams(scope: OpsScope, orgRef: string): string[] {
  return scope === "house" ? [] : [orgRef];
}

function asRecord(value: unknown): Record<string, unknown> {
  const clean = sanitizePayload(value);
  if (clean && typeof clean === "object" && !Array.isArray(clean)) {
    return clean as Record<string, unknown>;
  }
  return { value: clean };
}

function headlineFrom(payload: Record<string, unknown>, fallback: string | null): string | null {
  for (const key of ["title", "headline", "companyName", "reason"] as const) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function runtimeMark(env: Record<string, string | undefined>): "production" | "preview" | "local" {
  if (env.VERCEL_ENV === "preview") return "preview";
  if (env.VERCEL_ENV === "development") return "local";
  if (env.VERCEL_ENV === "production" || env.APP_ENV === "prod" || env.APP_ENV === "production") {
    return "production";
  }
  return "local";
}

async function countOutbox(
  pool: Queryable,
  table: string,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsQueueCounts> {
  try {
    const { rows } = await pool.query<{ status: string; n: string }>(
      `select status, count(*)::text as n
         from ${table}
        where true${orgWhere(scope)}
        group by status`,
      orgParams(scope, orgRef),
    );
    const counts = emptyCounts();
    for (const row of rows) {
      const n = Number(row.n ?? 0);
      if (row.status === "PENDING") counts.pending += n;
      else if (row.status === "SENT") counts.sent += n;
      else if (row.status === "FAILED") counts.failed += n;
      else if (row.status === "BLOCKED") counts.blocked += n;
    }
    return counts;
  } catch {
    return emptyCounts();
  }
}

export async function loadOpsQueues(
  pool: Queryable,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsQueues> {
  const [sales, alarms, reminders] = await Promise.all([
    countOutbox(pool, "ekonomi.sales_alert_outbox", scope, orgRef),
    countOutbox(pool, "platform.alarm_outbox", scope, orgRef),
    countOutbox(pool, "tyra.reminder_outbox", scope, orgRef),
  ]);
  return { sales, alarms, reminders };
}

export async function countBlockedReminders(
  pool: Queryable,
  scope: OpsScope,
  orgRef: string,
): Promise<number> {
  try {
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n
         from tyra.reminder_outbox
        where status in ('FAILED','BLOCKED')
          and created_at >= now() - interval '7 days'${orgWhere(scope)}`,
      orgParams(scope, orgRef),
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}

function errorFromEvent(row: {
  id: string;
  occurred_at: Date;
  system: string;
  kind: string;
  request_id: string | null;
  subject_ref: string | null;
  payload: unknown;
}): OpsErrorRow {
  const payload = asRecord(row.payload);
  return {
    id: String(row.id),
    at: new Date(row.occurred_at).toISOString(),
    system: row.system,
    kind: row.kind,
    requestId: row.request_id,
    subjectRef: row.subject_ref,
    headline: headlineFrom(payload, row.subject_ref),
  };
}

export async function loadLastErrors(
  pool: Queryable,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsErrorRow[]> {
  const where = orgWhere(scope);
  const params = orgParams(scope, orgRef);
  const rows: OpsErrorRow[] = [];

  try {
    const events = await pool.query<{
      id: string;
      occurred_at: Date;
      system: string;
      kind: string;
      request_id: string | null;
      subject_ref: string | null;
      payload: unknown;
    }>(
      `select id::text, occurred_at, system, kind, request_id, subject_ref, payload
         from platform.events
        where (kind like '%.failed' or kind like '%.blocked')${where}
        order by occurred_at desc
        limit ${ERROR_LIMIT}`,
      params,
    );
    rows.push(...events.rows.map(errorFromEvent));
  } catch {
    /* events may be missing before migrate */
  }

  const outboxes: { table: string; system: string }[] = [
    { table: "ekonomi.sales_alert_outbox", system: "ekonomi" },
    { table: "platform.alarm_outbox", system: "platform" },
    { table: "tyra.reminder_outbox", system: "tyra" },
  ];
  for (const item of outboxes) {
    try {
      const result = await pool.query<{
        id: string;
        status: string;
        body: string;
        last_error: string | null;
        created_at: Date;
      }>(
        `select id, status, body, last_error, created_at
           from ${item.table}
          where status in ('FAILED','BLOCKED')${where}
          order by created_at desc
          limit 8`,
        params,
      );
      for (const row of result.rows) {
        const headline = row.last_error?.trim() || row.body.trim().slice(0, 120) || null;
        rows.push({
          id: row.id,
          at: new Date(row.created_at).toISOString(),
          system: item.system,
          kind: `${item.system}.outbox.${row.status.toLowerCase()}`,
          requestId: null,
          subjectRef: row.id,
          headline,
        });
      }
    } catch {
      /* table may be missing before migrate */
    }
  }

  return rows.sort((a, b) => b.at.localeCompare(a.at)).slice(0, ERROR_LIMIT);
}

export function loadRuntimeDebug(
  env: Record<string, string | undefined> = process.env,
): OpsRuntimeDebug {
  return {
    mark: runtimeMark(env),
    hardened: isHardenedRuntime(env),
    vercelEnv: env.VERCEL_ENV ?? null,
    appEnv: env.APP_ENV ?? null,
    seedDemo: env.PIXDRIFT_SEED_DEMO === "true",
    cronSet: Boolean(env.CRON_SECRET),
    smsSet: Boolean((env.ELKS_API_USERNAME || env.ELKS_API_USER) && env.ELKS_API_PASSWORD),
    ttsSet: Boolean(env.ELEVENLABS_API_KEY || env.ELEVEN_API_KEY),
    sessionSecretSet: Boolean(env.APP_SESSION_SECRET || env.PIXDRIFT_SESSION_SECRET),
    cookieSecure: env.COOKIE_SECURE !== "false",
  };
}

export async function lookupOpsDebug(
  pool: Queryable,
  input: { q: string; scope: OpsScope; orgRef: string },
): Promise<OpsDebugLookup> {
  const q = input.q.trim();
  if (q.length < MIN_QUERY) {
    return { q, events: [], outbox: [], note: "Skriv minst tre tecken." };
  }

  const events = await lookupEvents(pool, input.scope, input.orgRef, q);
  const outbox = (
    await Promise.all([
      lookupOutbox(
        pool,
        "sales",
        "ekonomi.sales_alert_outbox",
        "invoice_id",
        input.scope,
        input.orgRef,
        q,
      ),
      lookupOutbox(pool, "alarm", "platform.alarm_outbox", "kind", input.scope, input.orgRef, q),
      lookupOutbox(
        pool,
        "reminder",
        "tyra.reminder_outbox",
        "customer_id",
        input.scope,
        input.orgRef,
        q,
      ),
    ])
  ).flat();

  const note =
    events.length === 0 && outbox.length === 0
      ? "Inget träffade. Prova request-id, händelse-id eller ett ärende."
      : null;
  return {
    q,
    events: events.slice(0, LOOKUP_LIMIT),
    outbox: outbox.slice(0, LOOKUP_LIMIT),
    note,
  };
}

async function lookupEvents(
  pool: Queryable,
  scope: OpsScope,
  orgRef: string,
  q: string,
): Promise<OpsDebugHit[]> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (scope === "org") {
    values.push(orgRef);
    clauses.push(`org_ref = $${values.length}`);
  }
  values.push(q);
  const p = `$${values.length}`;
  clauses.push(
    `(request_id = ${p} or id::text = ${p} or subject_ref = ${p} or kind = ${p} or kind like ${p} || '.%')`,
  );

  try {
    const { rows } = await pool.query<{
      id: string;
      occurred_at: Date;
      system: string;
      kind: string;
      org_ref: string | null;
      actor_ref: string | null;
      subject_ref: string | null;
      request_id: string | null;
      payload: unknown;
    }>(
      `select id::text, occurred_at, system, kind, org_ref, actor_ref, subject_ref, request_id, payload
         from platform.events
        where ${clauses.join(" and ")}
        order by occurred_at desc
        limit ${LOOKUP_LIMIT}`,
      values,
    );
    return rows.map((row) => ({
      id: row.id,
      at: new Date(row.occurred_at).toISOString(),
      system: row.system,
      kind: row.kind,
      orgRef: row.org_ref,
      requestId: row.request_id,
      subjectRef: row.subject_ref,
      actorRef: row.actor_ref,
      payload: asRecord(row.payload),
    }));
  } catch {
    return [];
  }
}

async function lookupOutbox(
  pool: Queryable,
  source: "sales" | "alarm" | "reminder",
  table: string,
  extraColumn: string,
  scope: OpsScope,
  orgRef: string,
  q: string,
): Promise<OpsDebugLookup["outbox"]> {
  const values: unknown[] = [];
  const clauses: string[] = [];
  if (scope === "org") {
    values.push(orgRef);
    clauses.push(`org_ref = $${values.length}`);
  }
  values.push(q);
  const p = `$${values.length}`;
  clauses.push(`(id = ${p} or ${extraColumn} = ${p})`);

  try {
    const { rows } = await pool.query<{
      id: string;
      status: string;
      body: string;
      last_error: string | null;
      created_at: Date;
    }>(
      `select id, status, body, last_error, created_at
         from ${table}
        where ${clauses.join(" and ")}
        order by created_at desc
        limit ${LOOKUP_LIMIT}`,
      values,
    );
    return rows.map((row) => ({
      source,
      id: row.id,
      status: row.status,
      body:
        typeof sanitizePayload(row.body) === "string"
          ? String(sanitizePayload(row.body))
          : row.body.slice(0, 400),
      lastError: row.last_error ? String(sanitizePayload(row.last_error)) : null,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  } catch {
    return [];
  }
}
