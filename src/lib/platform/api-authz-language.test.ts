import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("API authz language", () => {
  it("uses English-canonical forbidden and database titles", () => {
    const authz = readFileSync("packages/api-core/src/authz.ts", "utf8");
    const actions = readFileSync("src/lib/platform/actions.ts", "utf8");
    const runtime = readFileSync("src/lib/platform/runtime.ts", "utf8");
    const mcp = readFileSync("src/lib/mcp/runtime.ts", "utf8");
    expect(authz).toContain("Sign in with Pixdrift identity.");
    expect(authz).toContain("No active organisation in the session.");
    expect(authz).toContain("Missing permission ${permission}.");
    expect(authz).not.toContain("Saknar behörighet");
    expect(authz).not.toContain("Ingen aktiv organisation");
    expect(actions).toContain("Missing permission ${permission}.");
    expect(actions).not.toContain("Saknar behörighet");
    expect(runtime).toContain("The database is not configured.");
    expect(runtime).toContain("Set DATABASE_URL for the app role.");
    expect(mcp).toContain("The database is not available.");
    expect(mcp).not.toContain("Databasen är inte");
  });
});
