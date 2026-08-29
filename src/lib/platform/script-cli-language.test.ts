import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function runScript(script: string, extraEnv: Record<string, string | undefined> = {}) {
  const env = { ...process.env, ...extraEnv };
  delete env.PIXDRIFT_DB_OWNER_URL;
  delete env.PIXDRIFT_TEST_OWNER_URL;
  delete env.DATABASE_URL;
  delete env.PIXDRIFT_TEST_DATABASE_URL;
  return spawnSync("pnpm", ["exec", "tsx", script], { encoding: "utf8", env });
}

describe("leftover workspace script CLI language", () => {
  it("uses English-canonical leftover migrate and ops-lookup usage", () => {
    const migrate = readFileSync("scripts/migrate.ts", "utf8");
    const ops = readFileSync("scripts/ops-lookup.ts", "utf8");
    expect(migrate).toContain("Set PIXDRIFT_DB_OWNER_URL (or PIXDRIFT_TEST_OWNER_URL in test).");
    expect(ops).toContain("Usage: pnpm ops:lookup -- <request-id>");
    expect(ops).toContain("Set DATABASE_URL (the app role, not the owner).");
    expect(migrate).not.toContain("Sätt PIXDRIFT_DB_OWNER_URL");
    expect(ops).not.toContain("Användning:");
    expect(ops).not.toContain("Sätt DATABASE_URL");
  });

  it("prints the English-canonical usage and does not migrate or look up", () => {
    const migrate = runScript("scripts/migrate.ts");
    expect(migrate.status).toBe(1);
    expect(migrate.stderr).toContain(
      "Set PIXDRIFT_DB_OWNER_URL (or PIXDRIFT_TEST_OWNER_URL in test).",
    );

    const usage = runScript("scripts/ops-lookup.ts");
    expect(usage.status).toBe(1);
    expect(usage.stderr).toContain("Usage: pnpm ops:lookup -- <request-id>");

    const noDb = spawnSync("pnpm", ["exec", "tsx", "scripts/ops-lookup.ts", "req-test"], {
      encoding: "utf8",
      env: (() => {
        const env = { ...process.env };
        delete env.DATABASE_URL;
        delete env.PIXDRIFT_TEST_DATABASE_URL;
        return env;
      })(),
    });
    expect(noDb.status).toBe(1);
    expect(noDb.stderr).toContain("Set DATABASE_URL (the app role, not the owner).");
  });

  it("leaves leftover vendor-check and Revolut cert script copy as written", () => {
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain("nyckeln är giltig");
    expect(readFileSync("scripts/revolut/generate-certificate.sh", "utf8")).toContain(
      "okänt argument:",
    );
  });
});
