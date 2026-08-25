import { existsSync } from "node:fs";
import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { registerSyncHandlers } from "../sync/handlers.ts";
import { requestAnalysis } from "./analyses.ts";
import { findingsFromAnalysis } from "./findings.ts";
import { DEMO_ORG_NUMBER, NO_DOCUMENTS_REASON } from "./request.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const BINARY = process.env.RITA_ENGINE_BINARY?.trim();
const live = OWNER && APP ? describe : describe.skip;
const liveEngine = OWNER && APP && BINARY && existsSync(BINARY) ? describe : describe.skip;

live("RITA requestAnalysis (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "rita-analyses-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("blocks with no documents instead of inventing findings", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:rita-nodoc-${Date.now()}`;
    const previous = process.env.RITA_ENGINE_BINARY;
    if (BINARY) process.env.RITA_ENGINE_BINARY = BINARY;
    try {
      const analysis = await requestAnalysis({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        companyName: "Exempelbolaget AB",
        orgNumber: DEMO_ORG_NUMBER,
        requestId: "req-nodoc",
        useDemoDocument: false,
      });
      expect(analysis.status).toBe("blocked");
      expect(analysis.result).toBeNull();
      if (BINARY && existsSync(BINARY)) {
        expect(analysis.blockedReason).toBe(NO_DOCUMENTS_REASON);
      } else {
        expect(analysis.blockedReason).toMatch(/inkopplad|inställd|RITA_ENGINE/);
      }
    } finally {
      if (previous) process.env.RITA_ENGINE_BINARY = previous;
      else if (!BINARY) delete process.env.RITA_ENGINE_BINARY;
    }
  });
});

liveEngine("RITA requestAnalysis against skattjakt", () => {
  const pool = createPool(APP!, { applicationName: "rita-engine-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("completes with findings from the demo bokslut", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    registerSyncHandlers(events, pool);
    const orgRef = `pixdrift:org:rita-engine-${Date.now()}`;
    const previous = process.env.RITA_ENGINE_BINARY;
    process.env.RITA_ENGINE_BINARY = BINARY!;
    try {
      const analysis = await requestAnalysis({
        pool,
        events,
        orgRef,
        actorRef: "user-test",
        companyName: "Exempelbolaget AB",
        orgNumber: DEMO_ORG_NUMBER,
        requestId: "req-engine",
        useDemoDocument: true,
      });
      expect(analysis.status).toBe("completed");
      expect(analysis.blockedReason).toBeNull();
      const envelope = analysis.result as { model_configured?: boolean } | null;
      if (process.env.ANTHROPIC_API_KEY?.trim()) {
        expect(envelope?.model_configured).toBe(true);
      }
      const findings = findingsFromAnalysis(analysis.result);
      expect(findings.length).toBeGreaterThanOrEqual(1);
      const completed = await events.list({ orgRef, kind: "rita.analysis.completed" });
      expect(completed).toHaveLength(1);
      expect(completed[0]?.payload["companyName"]).toBe("Exempelbolaget AB");
      expect(completed[0]?.payload["findingCount"]).toBe(findings.length);
      expect(typeof completed[0]?.payload["modelConfigured"]).toBe("boolean");
      const observations = await pool.query(
        `select title from britt.observations where org_ref = $1 and source_system = 'rita'`,
        [orgRef],
      );
      expect(observations.rows.map((row) => row.title)).toContain("RITA har slutfört en analys");
    } finally {
      if (previous) process.env.RITA_ENGINE_BINARY = previous;
      else delete process.env.RITA_ENGINE_BINARY;
    }
  }, 450_000);
});
