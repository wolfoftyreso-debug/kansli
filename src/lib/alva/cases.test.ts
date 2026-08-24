import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createCase, listCases } from "./cases.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("alva.cases (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "alva-cases-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("registers a case without inventing a diagnosis", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:alva-${Date.now()}`;

    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      complaint: "Oljud vid kallstart",
      vehicleRef: "ABC123",
      requestId: "req-alva-1",
    });

    expect(created.status).toBe("open");
    expect(created).not.toHaveProperty("diagnosis");
    expect(created).not.toHaveProperty("findings");

    const listed = await listCases(pool, orgRef);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.complaint).toBe("Oljud vid kallstart");

    const published = await events.list({ orgRef, kind: "alva.case.created" });
    expect(published).toHaveLength(1);
    expect(published[0]?.payload["note"]).toMatch(/ALVA-repot/);
  });
});
