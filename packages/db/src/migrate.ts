import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { poolConfig } from "./pool.ts";

/**
 * Numbered SQL files: `0001_foundation.sql`. The number is the version; the
 * rest is a label. One version, one file, applied in order, never rewritten.
 */
export const MIGRATION_FILENAME = /^(\d{4})_([a-z0-9][a-z0-9_]*)\.sql$/;

export interface MigrationFile {
  version: number;
  name: string;
  filename: string;
  sql: string;
  checksum: string;
}

export type SchemaGrant = "readwrite" | "append";

export interface MigrateOptions {
  connectionString: string;
  /** Directory of `NNNN_name.sql` files. */
  dir: string;
  /**
   * Optional Postgres schema this product owns. Created if missing; the
   * migrations table and `search_path` are scoped to it so products cannot
   * accidentally write each other's tables (constitution art. 2).
   */
  schema?: string;
  /** After applying files, grant the runtime app role access to this schema. */
  appRole?: string;
  /** `append` is insert+select only (event log). Default `readwrite`. */
  grant?: SchemaGrant;
}

export interface MigrateResult {
  applied: string[];
  already: string[];
}

export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
  }
}

export function parseMigrationFilename(filename: string): { version: number; name: string } {
  const match = MIGRATION_FILENAME.exec(filename);
  if (!match) {
    throw new MigrationError(
      `${filename} är inte en migrationsfil (förväntat NNNN_namn.sql, gemener)`,
    );
  }
  return { version: Number(match[1]), name: match[2]! };
}

export function checksumSql(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}

export async function loadMigrations(dir: string): Promise<MigrationFile[]> {
  const entries = await readdir(dir);
  const files = entries.filter((name) => name.endsWith(".sql")).sort();
  const loaded: MigrationFile[] = [];
  const seen = new Set<number>();

  for (const filename of files) {
    const { version, name } = parseMigrationFilename(filename);
    if (seen.has(version)) {
      throw new MigrationError(
        `två migrationsfiler delar version ${String(version).padStart(4, "0")}`,
      );
    }
    seen.add(version);
    const sql = await readFile(path.join(dir, filename), "utf8");
    loaded.push({ version, name, filename, sql, checksum: checksumSql(sql) });
  }

  return loaded;
}

function migrationsTable(schema?: string): string {
  return schema ? `${quoteIdent(schema)}.schema_migrations` : "schema_migrations";
}

export function quoteIdent(ident: string): string {
  if (!/^[a-z_][a-z0-9_]*$/.test(ident)) {
    throw new MigrationError(`ogiltigt schemanamn: ${ident}`);
  }
  return `"${ident}"`;
}

/**
 * Apply numbered SQL files in order. Idempotent: already-applied versions are
 * skipped. A checksum change on an applied version is a hard failure — rewrite
 * is not how migrations evolve; add a new file.
 *
 * Rollback is restore (constitution art. 3 + 11), not a down-script. A
 * destructive migration must be paired with a tested restore path before it
 * ships against customer data.
 */
export async function migrate(opts: MigrateOptions): Promise<MigrateResult> {
  const files = await loadMigrations(opts.dir);
  const pool = new pg.Pool(poolConfig(opts.connectionString));
  const table = migrationsTable(opts.schema);
  const applied: string[] = [];
  const already: string[] = [];

  try {
    if (opts.schema) {
      await pool.query(`create schema if not exists ${quoteIdent(opts.schema)}`);
    }

    await pool.query(
      `create table if not exists ${table} (
         version integer primary key,
         name text not null,
         checksum text not null,
         applied_at timestamptz not null default now()
       )`,
    );

    const { rows } = await pool.query<{ version: number; checksum: string }>(
      `select version, checksum from ${table} order by version`,
    );
    const byVersion = new Map(rows.map((row) => [row.version, row.checksum]));

    for (const file of files) {
      const existing = byVersion.get(file.version);
      if (existing) {
        if (existing !== file.checksum) {
          throw new MigrationError(
            `${file.filename} har ändrats efter att den applicerades ` +
              `(checksum ${existing.slice(0, 8)}… → ${file.checksum.slice(0, 8)}…). ` +
              `Lägg en ny fil i stället för att skriva om en applicerad migration.`,
          );
        }
        already.push(file.filename);
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("begin");
        if (opts.schema) {
          await client.query(`set local search_path to ${quoteIdent(opts.schema)}, public`);
        }
        await client.query(file.sql);
        await client.query(`insert into ${table} (version, name, checksum) values ($1, $2, $3)`, [
          file.version,
          file.name,
          file.checksum,
        ]);
        await client.query("commit");
        applied.push(file.filename);
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        const detail = error instanceof Error ? error.message : String(error);
        throw new MigrationError(`${file.filename} misslyckades: ${detail}`);
      } finally {
        client.release();
      }
    }

    if (opts.appRole && opts.schema) {
      await grantSchemaAccess(pool, opts.schema, opts.appRole, opts.grant ?? "readwrite");
    }

    return { applied, already };
  } finally {
    await pool.end();
  }
}

export async function grantSchemaAccess(
  pool: pg.Pool,
  schema: string,
  appRole: string,
  mode: SchemaGrant,
): Promise<void> {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(appRole)) {
    throw new MigrationError(`ogiltigt appRole: ${appRole}`);
  }
  const s = quoteIdent(schema);
  const dml = mode === "append" ? "select, insert" : "select, insert, update, delete";
  await pool.query(`grant usage on schema ${s} to ${appRole}`);
  await pool.query(`grant ${dml} on all tables in schema ${s} to ${appRole}`);
  await pool.query(`grant usage, select on all sequences in schema ${s} to ${appRole}`);
}
