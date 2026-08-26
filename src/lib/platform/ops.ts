import type pg from "pg";
import { quoteIdent, WORKSPACE_SCHEMAS } from "@pixdrift/db";
import { metricsSnapshot, type McpMetricSnapshot } from "@pixdrift/mcp-core";
import { SYSTEM_MODULES, type SystemId } from "@pixdrift/systems";
import { isHardenedRuntime } from "../auth/secrets.ts";
import { revolutConfigState } from "../ekonomi/revolut/config.ts";
import { isHouseSession } from "../kansli/intakes.ts";
import { ritaEngineSnapshot } from "../rita/resolve-engine.ts";
import { gatewaySnapshot } from "./ai.ts";
import { facadeRuntimeMark, orgIdFromRef } from "./facade.ts";
import { loadFirstCustomerBoard, type FirstCustomerBoard } from "./first-customer.ts";
import { hubStatus } from "./hub-status.ts";
import { smsConfigured } from "./sms.ts";
import {
  DATABASE_CONTRACT,
  IDENTITY_TABLES,
  knownProductKeys,
  PRODUCT_SCHEMAS,
  PRODUCT_TABLES,
  structureKey,
  type StructureTable,
  type TableTenancy,
} from "./structure.ts";

export type OpsScope = "house" | "org";

export type OpsTableMeasure = {
  schema: string;
  table: string;
  tenancy: TableTenancy | "unknown";
  system: SystemId | "platform" | null;
  rows: number | null;
  expected: boolean;
};

export type OpsSchemaMeasure = {
  schema: string;
  present: boolean;
  grant: "readwrite" | "append" | "identity";
  migrations: { version: number; name: string }[];
};

export type OpsEventMeasure = {
  system: string;
  count: number;
  lastAt: string | null;
};

export type OpsSnapshot = {
  takenAt: string;
  scope: OpsScope;
  orgRef: string;
  orgName: string | null;
  runtime: "produktion" | "förhandsvisning" | "lokal";
  hardened: boolean;
  contract: typeof DATABASE_CONTRACT;
  health: {
    database: "up" | "down";
    gateway: { configured: boolean; auth: string };
    rita: { available: boolean; kind: string; modelReady: boolean };
    sms: boolean;
    revolut: { configured: boolean; environment: string };
    mcp: McpMetricSnapshot;
  };
  identity: {
    organizations: number | null;
    users: number | null;
    memberships: number | null;
  };
  schemas: OpsSchemaMeasure[];
  tables: OpsTableMeasure[];
  events: OpsEventMeasure[];
  readiness: FirstCustomerBoard;
};

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
  const [schemas, tables, events, identity, readiness] = await Promise.all([
    loadSchemas(pool),
    loadTables(pool, scope),
    loadEvents(pool, scope, input.orgRef),
    loadIdentity(pool, scope, input.orgRef),
    loadFirstCustomerBoard(pool, input.orgRef),
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
      revolut: { configured: revolut.missing.length === 0, environment: revolut.environment },
      mcp: metricsSnapshot(),
    },
    identity,
    schemas,
    tables,
    events,
    readiness,
  };
}

export function unexpectedTables(snapshot: OpsSnapshot): OpsTableMeasure[] {
  return snapshot.tables.filter((table) => !table.expected);
}

/** Used by tests so we do not invent identity table names. */
export function identityTableNames(): readonly string[] {
  return IDENTITY_TABLES;
}
