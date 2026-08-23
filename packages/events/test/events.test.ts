import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "../src/index.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("EventLog (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "events-test", max: 2 });

  beforeAll(async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
  });

  afterAll(async () => {
    await pool.end();
  });

  it("appends, lists, and fans out to another system's handler", async () => {
    const log = new EventLog(pool);
    const seen: string[] = [];
    log.subscribe("tora.market.evaluated", async (event) => {
      seen.push(event.kind);
      await pool.query(
        `insert into britt.observations (id, org_ref, source_system, title, body, severity)
         values ($1,$2,'tora',$3,$4,'info')`,
        [
          `obs-test-${event.id}`,
          event.orgRef,
          "TORA utvärderade marknaden",
          String(event.payload["headline"] ?? ""),
        ],
      );
    });

    const orgRef = `pixdrift:org:events-test-${Date.now()}`;
    const published = await log.publish({
      system: "tora",
      kind: "tora.market.evaluated",
      orgRef,
      payload: { headline: "2 öppna" },
    });
    expect(published.id).toMatch(/^\d+$/);
    expect(seen).toEqual(["tora.market.evaluated"]);

    const listed = await log.list({ orgRef, kind: "tora.market.evaluated" });
    expect(listed.map((e) => e.id)).toContain(published.id);

    const { rows } = await pool.query<{ title: string }>(
      `select title from britt.observations where org_ref = $1`,
      [orgRef],
    );
    expect(rows[0]?.title).toBe("TORA utvärderade marknaden");
  });
});
