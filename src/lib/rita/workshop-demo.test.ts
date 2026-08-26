/**
 * One live workshop through the real RITA engine with the built-in example books.
 * Opt-in: LIVE_RITA_WORKSHOP=1
 */
import { describe, expect, it } from "vitest";
import { createPool } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { requestAnalysis } from "./analyses.ts";
import { DEMO_ORG_NUMBER } from "./request.ts";

const APP = process.env.DATABASE_URL;
const ORG = process.env.LIVE_RITA_ORG_REF ?? "pixdrift:org:org-holm-dack-umea-ab-141537";
const live = process.env.LIVE_RITA_WORKSHOP === "1" && APP ? describe : describe.skip;

live("RITA demo document on a live workshop", () => {
  it("completes instead of inventing findings", async () => {
    const pool = createPool(APP!, { applicationName: "rita-workshop-demo", max: 2 });
    try {
      const events = new EventLog(pool);
      const analysis = await requestAnalysis({
        pool,
        events,
        orgRef: ORG,
        actorRef: "live-fleet-rita",
        companyName: "Holm Däck Umeå AB",
        orgNumber: DEMO_ORG_NUMBER,
        requestId: `rita-workshop-${String(Date.now())}`,
        useDemoDocument: true,
      });
      expect(analysis.status, analysis.blockedReason ?? analysis.status).toBe("completed");
      expect(analysis.blockedReason).toBeNull();
    } finally {
      await pool.end();
    }
  }, 300_000);
});
