import type pg from "pg";
import { quoteIdent, WORKSPACE_SCHEMAS } from "@pixdrift/db";
import { metricsSnapshot } from "@pixdrift/mcp-core";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { isHardenedRuntime } from "../auth/secrets.ts";
import { revolutConfigState } from "../ekonomi/revolut/config.ts";
import { isHouseSession } from "../kansli/intakes.ts";
import { ritaEngineSnapshot } from "../rita/resolve-engine.ts";
import { gatewaySnapshot } from "./ai.ts";
import { facadeRuntimeMark, orgIdFromRef } from "./facade.ts";
import { loadLastErrors, loadOpsQueues, loadRuntimeDebug } from "./ops-debug.ts";
import { loadOpsDesk } from "./ops-desk.ts";
import { loadFirstCustomerBoard } from "./first-customer.ts";
import { hubStatus } from "./hub-status.ts";
import type {
  OpsEventMeasure,
  OpsPoint,
  OpsRecent,
  OpsSchemaMeasure,
  OpsScope,
  OpsSnapshot,
  OpsTableMeasure,
} from "./ops-view.ts";
import { vendorChannels } from "./channels.ts";
import { creditConfigured } from "./credit.ts";
import { smsConfigured } from "./sms.ts";
import { ttsConfigured } from "./tts.ts";
import { webintelConfigured } from "./webintel.ts";
import {
  DATABASE_CONTRACT,
  IDENTITY_TABLES,
  knownProductKeys,
  PRODUCT_SCHEMAS,
  PRODUCT_TABLES,
  structureKey,
  type StructureTable,
} from "./structure.ts";

export type {
  OpsEventMeasure,
  OpsPoint,
  OpsRecent,
  OpsSchemaMeasure,
  OpsScope,
  OpsSnapshot,
  OpsTableMeasure,
} from "./ops-view.ts";
export { seriesChangePct, seriesTotal } from "./ops-view.ts";

export function opsScopeFor(orgRef: string | null | undefined): OpsScope {
  return isHouseSession(orgRef) ? "house" : "org";
}

function workshopMaySee(table: StructureTable, scope: OpsScope): boolean {
  if (scope === "house") return true;
  return table.tenancy !== "house_org_ref";
}

async function countExact(pool: pg.Pool, schema: string, table: string): Promise<number | null> {
  try {
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n from ${quoteIdent(schema)}.${quoteIdent(table)}`,
    );
    return Number(rows[0]?.n ?? 0);
  } catch {
    return null;
  }
}

async function loadSchemas(pool: pg.Pool): Promise<OpsSchemaMeasure[]> {
  const { rows: present } = await pool.query<{ nspname: string }>(
    `select nspname from pg_namespace where nspname = any($1::text[])`,
    [PRODUCT_SCHEMAS],
  );
  const found = new Set(present.map((row) => row.nspname));

  return Promise.all(
    WORKSPACE_SCHEMAS.map(async (entry) => {
      let migrations: { version: number; name: string }[] = [];
      if (found.has(entry.schema)) {
        try {
          const { rows } = await pool.query<{ version: number; name: string }>(
            `select version, name from ${quoteIdent(entry.schema)}.schema_migrations order by version`,
          );
          migrations = rows;
        } catch {
          migrations = [];
        }
      }
      return {
        schema: entry.schema,
        present: found.has(entry.schema),
        grant: entry.grant,
        migrations,
      };
    }),
  );
}

async function loadTables(pool: pg.Pool, scope: OpsScope): Promise<OpsTableMeasure[]> {
  const { rows: live } = await pool.query<{ table_schema: string; table_name: string }>(
    `select table_schema, table_name
       from information_schema.tables
      where table_type = 'BASE TABLE'
        and table_schema = any($1::text[])
      order by table_schema, table_name`,
    [PRODUCT_SCHEMAS],
  );

  const expected = knownProductKeys();
  const known = new Map(
    PRODUCT_TABLES.map((item) => [structureKey(item.schema, item.table), item]),
  );
  const seen = new Set<string>();
  const pending: OpsTableMeasure[] = [];

  for (const row of live) {
    if (row.table_name === "schema_migrations") continue;
    const key = structureKey(row.table_schema, row.table_name);
    seen.add(key);
    const spec = known.get(key);
    if (spec && !workshopMaySee(spec, scope)) continue;
    pending.push({
      schema: row.table_schema,
      table: row.table_name,
      tenancy: spec?.tenancy ?? "unknown",
      system: spec?.system ?? null,
      rows: null,
      expected: expected.has(key),
    });
  }

  for (const spec of PRODUCT_TABLES) {
    if (!workshopMaySee(spec, scope)) continue;
    const key = structureKey(spec.schema, spec.table);
    if (seen.has(key)) continue;
    pending.push({
      schema: spec.schema,
      table: spec.table,
      tenancy: spec.tenancy,
      system: spec.system,
      rows: null,
      expected: true,
    });
  }

  const counted = await Promise.all(
    pending.map(async (item) => ({
      ...item,
      rows:
        item.expected || seen.has(structureKey(item.schema, item.table))
          ? await countExact(pool, item.schema, item.table)
          : null,
    })),
  );

  return counted.sort((a, b) =>
    structureKey(a.schema, a.table).localeCompare(structureKey(b.schema, b.table)),
  );
}

async function loadEvents(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsEventMeasure[]> {
  const systems = SYSTEM_MODULES.map((module) => module.id);
  const sql =
    scope === "house"
      ? `select system, count(*)::text as n, max(occurred_at) as last_at
           from platform.events
          group by system`
      : `select system, count(*)::text as n, max(occurred_at) as last_at
           from platform.events
          where org_ref = $1
          group by system`;
  const { rows } = await pool.query<{ system: string; n: string; last_at: Date | null }>(
    sql,
    scope === "house" ? [] : [orgRef],
  );
  const bySystem = new Map(rows.map((row) => [row.system, row]));
  return systems.map((system) => {
    const row = bySystem.get(system);
    return {
      system,
      count: Number(row?.n ?? 0),
      lastAt: row?.last_at ? new Date(row.last_at).toISOString() : null,
    };
  });
}

function hourKey(value: Date): string {
  return new Date(value).toISOString().slice(0, 13);
}

export function fillHourSeries(
  rows: { hour: Date | string; n: string | number }[],
  now = new Date(),
): OpsPoint[] {
  const byHour = new Map(rows.map((row) => [hourKey(new Date(row.hour)), Number(row.n)]));
  const end = new Date(now);
  end.setUTCMinutes(0, 0, 0);
  const points: OpsPoint[] = [];
  for (let i = 23; i >= 0; i -= 1) {
    const at = new Date(end);
    at.setUTCHours(end.getUTCHours() - i);
    points.push({ at: at.toISOString(), count: byHour.get(hourKey(at)) ?? 0 });
  }
  return points;
}

async function loadSeries(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<{ series: OpsPoint[]; previousWindow: number }> {
  const where = scope === "house" ? "" : " and org_ref = $1";
  const params = scope === "house" ? [] : [orgRef];
  const [hours, previous] = await Promise.all([
    pool.query<{ hour: Date; n: string }>(
      `select date_trunc('hour', occurred_at) as hour, count(*)::text as n
         from platform.events
        where occurred_at >= now() - interval '24 hours'${where}
        group by 1
        order by 1`,
      params,
    ),
    pool.query<{ n: string }>(
      `select count(*)::text as n
         from platform.events
        where occurred_at >= now() - interval '48 hours'
          and occurred_at < now() - interval '24 hours'${where}`,
      params,
    ),
  ]);
  return {
    series: fillHourSeries(hours.rows),
    previousWindow: Number(previous.rows[0]?.n ?? 0),
  };
}

async function loadRecent(pool: pg.Pool, scope: OpsScope, orgRef: string): Promise<OpsRecent[]> {
  const sql =
    scope === "house"
      ? `select id::text, occurred_at, system, kind, subject_ref, payload
           from platform.events
          order by id desc
          limit 8`
      : `select id::text, occurred_at, system, kind, subject_ref, payload
           from platform.events
          where org_ref = $1
          order by id desc
          limit 8`;
  const { rows } = await pool.query<{
    id: string;
    occurred_at: Date;
    system: string;
    kind: string;
    subject_ref: string | null;
    payload: Record<string, unknown>;
  }>(sql, scope === "house" ? [] : [orgRef]);
  return rows.map((row) => {
    const payload = row.payload ?? {};
    const headlineKeys = ["title", "headline", "companyName", "reason"] as const;
    let headline: string | null = null;
    for (const key of headlineKeys) {
      const value = payload[key];
      if (typeof value === "string" && value.trim()) {
        headline = value.trim();
        break;
      }
    }
    return {
      id: row.id,
      at: new Date(row.occurred_at).toISOString(),
      system: row.system,
      kind: row.kind,
      headline: headline ?? row.subject_ref,
    };
  });
}

async function loadIdentity(
  pool: pg.Pool,
  scope: OpsScope,
  orgRef: string,
): Promise<OpsSnapshot["identity"]> {
  const orgId = orgIdFromRef(orgRef);
  try {
    if (scope === "house") {
      const [orgs, users, memberships] = await Promise.all([
        pool.query<{ n: string }>(`select count(*)::text as n from organizations`),
        pool.query<{ n: string }>(`select count(*)::text as n from users`),
        pool.query<{ n: string }>(`select count(*)::text as n from memberships`),
      ]);
      return {
        organizations: Number(orgs.rows[0]?.n ?? 0),
        users: Number(users.rows[0]?.n ?? 0),
        memberships: Number(memberships.rows[0]?.n ?? 0),
      };
    }
    if (!orgId) {
      return { organizations: null, users: null, memberships: null };
    }
    const [users, memberships] = await Promise.all([
      pool.query<{ n: string }>(
        `select count(*)::text as n
           from users u
           join memberships m on m.user_id = u.id
          where m.org_id = $1`,
        [orgId],
      ),
      pool.query<{ n: string }>(`select count(*)::text as n from memberships where org_id = $1`, [
        orgId,
      ]),
    ]);
    return {
      organizations: 1,
      users: Number(users.rows[0]?.n ?? 0),
      memberships: Number(memberships.rows[0]?.n ?? 0),
    };
  } catch {
    return { organizations: null, users: null, memberships: null };
  }
}

export async function loadOpsSnapshot(
  pool: pg.Pool,
  input: { orgRef: string; orgName?: string | null; scope?: OpsScope },
): Promise<OpsSnapshot> {
  const scope = input.scope ?? opsScopeFor(input.orgRef);
  const status = hubStatus();
  const gateway = gatewaySnapshot();
  const rita = ritaEngineSnapshot();
  const revolut = revolutConfigState();
  const [schemas, tables, events, identity, readiness, activity] = await Promise.all([
    loadSchemas(pool),
    loadTables(pool, scope),
    loadEvents(pool, scope, input.orgRef),
    loadIdentity(pool, scope, input.orgRef),
    loadFirstCustomerBoard(pool, input.orgRef),
    Promise.all([loadSeries(pool, scope, input.orgRef), loadRecent(pool, scope, input.orgRef)]),
  ]);
  const [{ series, previousWindow }, recent] = activity;
  const blockedGates = readiness.gates.filter((gate) => gate.state === "blocked").length;
  const desk = await loadOpsDesk(pool, {
    orgRef: input.orgRef,
    scope,
    blockedGates,
    databaseDown: status.database === "down",
  });
  const [queues, lastErrors] = await Promise.all([
    loadOpsQueues(pool, scope, input.orgRef),
    loadLastErrors(pool, scope, input.orgRef),
  ]);

  return {
    takenAt: new Date().toISOString(),
    scope,
    orgRef: input.orgRef,
    orgName: input.orgName ?? null,
    runtime: facadeRuntimeMark(),
    hardened: isHardenedRuntime(),
    contract: DATABASE_CONTRACT,
    health: {
      database: status.database,
      gateway: { configured: gateway.configured, auth: gateway.auth },
      rita: { available: rita.available, kind: rita.kind, modelReady: rita.modelReady },
      sms: smsConfigured(),
      tts: ttsConfigured(),
      credit: creditConfigured(),
      webintel: webintelConfigured(),
      revolut: { configured: revolut.missing.length === 0, environment: revolut.environment },
      channels: vendorChannels(),
      mcp: metricsSnapshot(),
    },
    identity,
    schemas,
    tables,
    events,
    series,
    previousWindow,
    recent,
    readiness,
    notices: desk.notices,
    ledger: desk.ledger,
    support: desk.support,
    sms: desk.sms,
    queues,
    lastErrors,
    runtimeDebug: loadRuntimeDebug(),
  };
}

export function unexpectedTables(snapshot: OpsSnapshot): OpsTableMeasure[] {
  return snapshot.tables.filter((table) => !table.expected);
}

/** Used by tests so we do not invent identity table names. */
export function identityTableNames(): readonly string[] {
  return IDENTITY_TABLES;
}
