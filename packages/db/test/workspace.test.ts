import { describe, expect, it } from "vitest";
import { WORKSPACE_SCHEMAS, migrateWorkspace } from "../src/workspace.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL;
const live = OWNER ? describe : describe.skip;

describe("WORKSPACE_SCHEMAS", () => {
  it("covers every product schema exactly once", () => {
    const names = WORKSPACE_SCHEMAS.map((entry) => entry.schema);
    expect(names).toEqual(["platform", "kansli", "tora", "rita", "britt", "irma", "tyra", "alva"]);
    expect(WORKSPACE_SCHEMAS.find((e) => e.schema === "platform")?.grant).toBe("append");
  });
});

live("migrateWorkspace", () => {
  it("is idempotent against a real owner connection", async () => {
    const first = await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd() });
    const second = await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd() });
    expect(Object.keys(first)).toEqual(Object.keys(second));
    for (const schema of Object.keys(second)) {
      expect(second[schema]?.applied).toEqual([]);
    }
  });

  it("does not fail when several callers migrate at once", async () => {
    await Promise.all([
      migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd() }),
      migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd() }),
      migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd() }),
    ]);
  });
});
