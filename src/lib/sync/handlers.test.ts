import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { registerSyncHandlers } from "./handlers.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("registerSyncHandlers (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "sync-handlers-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("lets BRITT write only its own rows when the family publishes", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    registerSyncHandlers(events, pool);
    const orgRef = `pixdrift:org:sync-${Date.now()}`;

    await events.publish({
      system: "irma",
      kind: "irma.agreement.created",
      orgRef,
      payload: { title: "Avtal X" },
    });
    await events.publish({
      system: "alva",
      kind: "alva.case.created",
      orgRef,
      payload: { note: "Registrerat." },
    });
    await events.publish({
      system: "kansli",
      kind: "kansli.task.created",
      orgRef,
      payload: { title: "Ring kunden" },
    });

    const { rows } = await pool.query<{ source_system: string; title: string }>(
      `select source_system, title from britt.observations where org_ref = $1 order by created_at`,
      [orgRef],
    );
    expect(rows.map((r) => r.source_system)).toEqual(["irma", "alva", "kansli"]);
    expect(rows[0]?.title).toMatch(/IRMA/);
    expect(rows[2]?.title).toMatch(/Kansli/);
  });
});
