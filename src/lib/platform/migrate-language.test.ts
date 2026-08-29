import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  grantSchemaAccess,
  loadMigrations,
  parseMigrationFilename,
  quoteIdent,
} from "@pixdrift/db";

describe("migrate language", () => {
  const dirs: string[] = [];

  afterEach(async () => {
    await Promise.all(dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("uses English-canonical leftover migrate throws like Identity appRole", () => {
    const migrate = readFileSync("packages/db/src/migrate.ts", "utf8");
    expect(migrate).toContain("is not a migration file (expected NNNN_name.sql, lowercase)");
    expect(migrate).toContain("Two migration files share version");
    expect(migrate).toContain("Invalid schema name (must be a SQL identifier):");
    expect(migrate).toContain("has changed after it was applied");
    expect(migrate).toContain("Add a new file instead of rewriting an applied migration.");
    expect(migrate).toContain("failed:");
    expect(migrate).toContain("Invalid appRole (must be a SQL identifier):");
    expect(migrate).not.toContain("är inte en migrationsfil");
    expect(migrate).not.toContain("delar version");
    expect(migrate).not.toContain("ogiltigt schemanamn:");
    expect(migrate).not.toContain("ogiltigt appRole:");
    expect(migrate).not.toContain("har ändrats efter att den applicerades");
    expect(migrate).not.toContain("misslyckades:");
  });

  it("throws the English-canonical sentences before connecting", async () => {
    expect(() => parseMigrationFilename("foundation.sql")).toThrow(
      /foundation.sql is not a migration file \(expected NNNN_name.sql, lowercase\)/,
    );
    expect(() => quoteIdent("schema; drop table users")).toThrow(
      /Invalid schema name \(must be a SQL identifier\): schema; drop table users/,
    );
    expect(quoteIdent("pixdrift_identity")).toBe('"pixdrift_identity"');

    await expect(
      grantSchemaAccess(
        {} as never,
        "pixdrift_identity",
        "pixdrift_app; drop table users",
        "readwrite",
      ),
    ).rejects.toThrow(
      /Invalid appRole \(must be a SQL identifier\): pixdrift_app; drop table users/,
    );

    const dir = await mkdtemp(path.join(tmpdir(), "pixdrift-migrate-lang-"));
    dirs.push(dir);
    await writeFile(path.join(dir, "0001_a.sql"), "select 1;\n");
    await writeFile(path.join(dir, "0001_b.sql"), "select 2;\n");
    await expect(loadMigrations(dir)).rejects.toThrow(/Two migration files share version 0001/);
  });

  it("leaves leftover userinfo, TORA remedy and contracts throws as written", () => {
    expect(readFileSync("packages/auth-client/src/index.ts", "utf8")).toContain(
      "userinfo misslyckades:",
    );
    expect(readFileSync("packages/tora/src/domain/remedies.ts", "utf8")).toContain(
      "okänt rättsmedel:",
    );
    expect(readFileSync("packages/contracts/src/index.ts", "utf8")).toContain(
      "får inte ha behörighet till kunddata:",
    );
  });
});
