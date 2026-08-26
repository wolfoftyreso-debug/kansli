import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { registerSyncHandlers } from "../sync/handlers.ts";
import { DEMO_METRICS } from "./engine.ts";
import { listFindings, runIntel } from "./intel.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("BRITT intel (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "britt-intel-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("writes findings and turns high ones into observations", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    registerSyncHandlers(events, pool);
    const orgRef = `pixdrift:org:britt-intel-${Date.now()}`;

    await expect(
      runIntel({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        requestId: "req-intel-denied",
      }),
    ).rejects.toThrow(/bara på huset/);

    const result = await runIntel({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      requestId: "req-intel",
      facts: DEMO_METRICS,
    });
    expect(result.findings.length).toBe(3);
    expect(result.snapshot.period).toBe("2026-07");

    const stored = await listFindings(pool, orgRef);
    expect(stored.map((item) => item.fingerprint).sort()).toEqual([
      "customer_concentration",
      "liquidity_runway",
      "revenue_below_plan",
    ]);

    const { rows } = await pool.query<{ title: string; severity: string }>(
      `select title, severity from britt.observations where org_ref = $1 order by created_at`,
      [orgRef],
    );
    expect(rows.every((row) => row.severity === "high")).toBe(true);
    expect(rows).toHaveLength(2);

    const recorded = await events.list({ orgRef, kind: "britt.finding.recorded" });
    expect(recorded).toHaveLength(3);
  });
});
