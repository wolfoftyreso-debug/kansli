import path from "node:path";
import pg from "pg";
import { migrate, type MigrateResult, type SchemaGrant } from "./migrate.ts";
import { poolConfig } from "./pool.ts";

/** Session advisory lock so parallel tests do not GRANT the same catalog row. */
const WORKSPACE_MIGRATE_LOCK = "pixdrift.workspace.migrate";

/**
 * The schemas this workspace owns. Directory name under `db/migrations`
 * equals the Postgres schema. Identity stays in `public` and is bootstrapped
 * separately — it is not in this list.
 */
export const WORKSPACE_SCHEMAS = [
  { schema: "platform", grant: "append" as const },
  { schema: "kansli", grant: "readwrite" as const },
  { schema: "ekonomi", grant: "readwrite" as const },
  { schema: "tora", grant: "readwrite" as const },
  { schema: "rita", grant: "readwrite" as const },
  { schema: "britt", grant: "readwrite" as const },
  { schema: "irma", grant: "readwrite" as const },
  { schema: "tyra", grant: "readwrite" as const },
  { schema: "alva", grant: "readwrite" as const },
] as const;

export interface WorkspaceMigrateOptions {
  ownerUrl: string;
  /** Repo root (contains `db/migrations`). */
  root: string;
  appRole?: string;
}

export async function migrateWorkspace(
  opts: WorkspaceMigrateOptions,
): Promise<Record<string, MigrateResult>> {
  const results: Record<string, MigrateResult> = {};
  const appRole = opts.appRole ?? "pixdrift_app";
  const lockPool = new pg.Pool({ ...poolConfig(opts.ownerUrl), max: 1 });
  const lockClient = await lockPool.connect();

  try {
    await lockClient.query("select pg_advisory_lock(hashtext($1::text))", [WORKSPACE_MIGRATE_LOCK]);
    for (const entry of WORKSPACE_SCHEMAS) {
      results[entry.schema] = await migrate({
        connectionString: opts.ownerUrl,
        dir: path.join(opts.root, "db/migrations", entry.schema),
        schema: entry.schema,
        appRole,
        grant: entry.grant as SchemaGrant,
      });
    }
    return results;
  } finally {
    await lockClient
      .query("select pg_advisory_unlock(hashtext($1::text))", [WORKSPACE_MIGRATE_LOCK])
      .catch(() => undefined);
    lockClient.release();
    await lockPool.end();
  }
}
