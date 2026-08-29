import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { grantsSql } from "@pixdrift/identity";

describe("Identity ops language", () => {
  it("uses English-canonical ops throws like the boot guard", () => {
    const store = readFileSync("packages/identity/src/pg/store.ts", "utf8");
    const schema = readFileSync("packages/identity/src/pg/schema.ts", "utf8");
    expect(store).toContain("No active signing key — run pgBootstrap first.");
    expect(schema).toContain("Invalid appRole (must be a SQL identifier):");
    expect(store).not.toContain("ingen aktiv signeringsnyckel");
    expect(schema).not.toContain("ogiltigt appRole");
  });

  it("refuses a hostile appRole before emitting GRANT SQL", () => {
    expect(() => grantsSql("pixdrift_app; drop table users")).toThrow(
      /Invalid appRole \(must be a SQL identifier\): pixdrift_app; drop table users/,
    );
    expect(grantsSql("pixdrift_app")).toContain("grant usage on schema public to pixdrift_app");
  });

  it("leaves migrate appRole throws as written", () => {
    expect(readFileSync("packages/db/src/migrate.ts", "utf8")).toContain("ogiltigt appRole:");
  });
});
