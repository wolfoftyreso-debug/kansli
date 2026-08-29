import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import pg from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { poolConfig } from "../src/pool.ts";
import {
  checksumSql,
  loadMigrations,
  isConcurrentCatalogUpdate,
  migrate,
  MigrationError,
  parseMigrationFilename,
} from "../src/migrate.ts";

describe("parseMigrationFilename", () => {
  it("reads version and name", () => {
    expect(parseMigrationFilename("0001_foundation.sql")).toEqual({
      version: 1,
      name: "foundation",
    });
    expect(parseMigrationFilename("0012_add_audit.sql")).toEqual({
      version: 12,
      name: "add_audit",
    });
  });

  it("rejects a renamed or unnumbered file", () => {
    expect(() => parseMigrationFilename("foundation.sql")).toThrow(MigrationError);
    expect(() => parseMigrationFilename("1_foundation.sql")).toThrow(MigrationError);
    expect(() => parseMigrationFilename("0001_Foundation.sql")).toThrow(
      /is not a migration file \(expected NNNN_name.sql, lowercase\)/,
    );
  });
});

describe("isConcurrentCatalogUpdate", () => {
  it("matches the Postgres catalog race from parallel GRANT", () => {
    expect(isConcurrentCatalogUpdate(new Error("tuple concurrently updated"))).toBe(true);
    expect(isConcurrentCatalogUpdate(new Error("duplicate key"))).toBe(false);
  });
});

describe("checksumSql", () => {
  it("is stable for the same SQL and changes when the file changes", () => {
    const a = checksumSql("create table t (id text);\n");
    const b = checksumSql("create table t (id text);\n");
    const c = checksumSql("create table t (id text, name text);\n");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("loadMigrations", () => {
  const dirs: string[] = [];

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  async function scratch(): Promise<string> {
    const dir = await mkdtemp(path.join(tmpdir(), "pixdrift-db-"));
    dirs.push(dir);
    return dir;
  }

  it("loads files in version order", async () => {
    const dir = await scratch();
    await writeFile(path.join(dir, "0002_later.sql"), "select 2;\n");
    await writeFile(path.join(dir, "0001_first.sql"), "select 1;\n");
    const files = await loadMigrations(dir);
    expect(files.map((f) => f.filename)).toEqual(["0001_first.sql", "0002_later.sql"]);
    expect(files[0]?.checksum).toBe(checksumSql("select 1;\n"));
  });

  it("rejects two files that share a version", async () => {
    const dir = await scratch();
    await writeFile(path.join(dir, "0001_a.sql"), "select 1;\n");
    await writeFile(path.join(dir, "0001_b.sql"), "select 2;\n");
    await expect(loadMigrations(dir)).rejects.toThrow(/Two migration files share version/);
  });
});

/** Migrations run as the schema owner, never the app role. */
const OWNER_URL = process.env.PIXDRIFT_TEST_OWNER_URL;
const live = OWNER_URL ? describe : describe.skip;

live("migrate (live Postgres)", () => {
  const dirs: string[] = [];
  const schemas: string[] = [];

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
    if (schemas.length === 0) return;
    const pool = new pg.Pool(poolConfig(OWNER_URL!));
    try {
      for (const schema of schemas.splice(0)) {
        await pool.query(`drop schema if exists "${schema}" cascade`);
      }
    } finally {
      await pool.end();
    }
  });

  it("applies once, no-ops on rerun, and refuses a rewritten file", async () => {
    const schema = `dbtest_${Date.now()}`;
    schemas.push(schema);
    const dir = await mkdtemp(path.join(tmpdir(), "pixdrift-db-live-"));
    dirs.push(dir);
    await writeFile(
      path.join(dir, "0001_widget.sql"),
      "create table widget (id text primary key);\n",
    );

    const first = await migrate({ connectionString: OWNER_URL!, dir, schema });
    expect(first.applied).toEqual(["0001_widget.sql"]);
    expect(first.already).toEqual([]);

    const second = await migrate({ connectionString: OWNER_URL!, dir, schema });
    expect(second.applied).toEqual([]);
    expect(second.already).toEqual(["0001_widget.sql"]);

    await writeFile(
      path.join(dir, "0001_widget.sql"),
      "create table widget (id text primary key, name text);\n",
    );
    await expect(migrate({ connectionString: OWNER_URL!, dir, schema })).rejects.toThrow(
      /has changed after it was applied/,
    );
  });
});
