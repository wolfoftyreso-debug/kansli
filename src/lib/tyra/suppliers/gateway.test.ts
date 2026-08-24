import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { resolveAdapter, searchSupplierProducts } from "./gateway.ts";

describe("supplier gateway", () => {
  it("registers no live adapter", () => {
    expect(resolveAdapter("ntg")).toBeNull();
    expect(resolveAdapter("delticom")).toBeNull();
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("supplier search (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "tyra-supplier-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("returns NOT_CONFIGURED instead of demo prices", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const result = await searchSupplierProducts({
      pool,
      orgRef: `pixdrift:org:tyra-sup-${Date.now()}`,
      identity: { width: 225, aspectRatio: 45, rimDiameter: 17, season: "winter" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("NOT_CONFIGURED");
    }
  });
});
