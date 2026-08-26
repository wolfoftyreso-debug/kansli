import type pg from "pg";

/** GUC the request path sets so RLS can see the active organisation. */
export const APP_ORG_SETTING = "app.org_ref";

export const TENANT_SCHEMAS = [
  "platform",
  "kansli",
  "ekonomi",
  "tora",
  "rita",
  "britt",
  "irma",
  "tyra",
  "alva",
] as const;

/**
 * Product tables that are allowed to lack `org_ref`.
 * `schema_migrations` is owned by the migrator, not by a customer.
 * `ekonomi.accounts` is the shared chart of accounts.
 * `kansli.intakes` is house CRM (`house_org_ref`), not a workshop tenant row.
 */
export const TABLES_WITHOUT_ORG_REF = new Set(["ekonomi.accounts", "kansli.intakes"]);

export function isTenantSchema(schema: string): boolean {
  return (TENANT_SCHEMAS as readonly string[]).includes(schema);
}

export function tableNeedsOrgRef(schema: string, table: string): boolean {
  if (table === "schema_migrations") return false;
  return !TABLES_WITHOUT_ORG_REF.has(`${schema}.${table}`);
}

/**
 * Same Postgres pool, but every query/connection pins `app.org_ref`.
 * RLS policies use that setting. Cron, guest tokens and house intakes keep
 * the unbound pool so they can look up by secret or run across orgs.
 */
export function bindOrgPool(pool: pg.Pool, orgRef: string): pg.Pool {
  const pinned = orgRef.trim();
  if (!pinned) throw new Error("orgRef krävs för tenant-pool.");

  async function connect(): Promise<pg.PoolClient> {
    const client = await pool.connect();
    try {
      await client.query("select set_config($1, $2, false)", [APP_ORG_SETTING, pinned]);
    } catch (error) {
      client.release();
      throw error;
    }
    const release = client.release.bind(client);
    let released = false;
    client.release = ((err?: Error | boolean) => {
      if (released) return release(err as Error);
      released = true;
      return client.query("select set_config($1, $2, false)", [APP_ORG_SETTING, ""]).then(
        () => release(err as Error),
        () => release(err as Error),
      );
    }) as typeof client.release;
    return client;
  }

  const query = (async (...args: unknown[]) => {
    const client = await connect();
    try {
      return await (client.query as (...queryArgs: unknown[]) => Promise<pg.QueryResult>)(...args);
    } finally {
      await client.release();
    }
  }) as pg.Pool["query"];

  return new Proxy(pool, {
    get(target, prop) {
      if (prop === "query") return query;
      if (prop === "connect") return connect;
      const value = Reflect.get(target, prop);
      return typeof value === "function"
        ? (value as (...fnArgs: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}
