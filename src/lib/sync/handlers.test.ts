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
      system: "rita",
      kind: "rita.analysis.completed",
      orgRef,
      payload: { companyName: "Exempelbolaget AB", findingCount: 7, modelConfigured: true },
    });
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
    await events.publish({
      system: "irma",
      kind: "irma.agreement.signed",
      orgRef,
      payload: { title: "Avtal X" },
    });
    await events.publish({
      system: "britt",
      kind: "britt.finding.recorded",
      orgRef,
      payload: { title: "Omsättningen ligger under plan", severity: "high" },
    });
    await events.publish({
      system: "britt",
      kind: "britt.finding.recorded",
      orgRef,
      payload: { title: "Medelfynd", severity: "medium" },
    });

    const { rows } = await pool.query<{ source_system: string; title: string; severity: string }>(
      `select source_system, title, severity from britt.observations where org_ref = $1 order by created_at`,
      [orgRef],
    );
    expect(rows.map((r) => r.source_system)).toEqual([
      "rita",
      "irma",
      "alva",
      "kansli",
      "irma",
      "britt",
    ]);
    expect(rows[0]?.title).toMatch(/RITA/);
    expect(rows[1]?.title).toMatch(/IRMA/);
    expect(rows[3]?.title).toMatch(/Kansli/);
    expect(rows[4]?.title).toMatch(/bekräftat/);
    expect(rows[5]?.severity).toBe("high");
    expect(rows.some((row) => row.title === "Medelfynd")).toBe(false);
    const ritaBody = await pool.query<{ body: string }>(
      `select body from britt.observations where org_ref = $1 and source_system = 'rita'`,
      [orgRef],
    );
    expect(ritaBody.rows[0]?.body).toMatch(/Exempelbolaget AB: 7 fynd/);
    expect(ritaBody.rows[0]?.body).toMatch(/Med AI-stöd/);
  });
});
