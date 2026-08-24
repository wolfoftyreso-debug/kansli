import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { evaluateMarket, listSnapshots, persistSnapshot } from "./persist.ts";
import { getCompanyProfile, upsertCompanyProfile } from "./profile.ts";

describe("evaluateMarket", () => {
  it("runs the engine without a database", () => {
    const free = evaluateMarket("free");
    expect(free.company).toBeTruthy();
    expect(free.tier).toBe("free");
    expect(free.market.summary.openNowCount).toBeGreaterThanOrEqual(0);
    expect(free.market.summary.knownValueSek).toBeGreaterThan(0);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("persistSnapshot (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "tora-persist-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("writes a snapshot and a family event only when published", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:tora-persist-${Date.now()}`;

    const before = await events.list({ orgRef, kind: "tora.market.evaluated" });
    evaluateMarket("enterprise");
    const afterEvaluate = await events.list({ orgRef, kind: "tora.market.evaluated" });
    expect(afterEvaluate.map((e) => e.id)).toEqual(before.map((e) => e.id));

    const stored = await persistSnapshot({
      pool,
      events,
      orgRef,
      tier: "enterprise",
      actorRef: "user-test",
      requestId: "req-test",
    });
    expect(stored.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );

    const snapshots = await listSnapshots(pool, orgRef);
    expect(snapshots[0]?.id).toBe(stored.id);
    expect(snapshots[0]?.openNow).toBe(stored.market.summary.openNowCount);

    const listed = await events.list({ orgRef, kind: "tora.market.evaluated" });
    expect(listed.some((event) => event.subjectRef === `tora:snapshot:${stored.id}`)).toBe(true);
    expect(snapshots[0]?.companyName).not.toBe("Pilotkund El AB");

    await upsertCompanyProfile({
      pool,
      orgRef,
      name: "Pilotkund El AB",
      employees: 12,
      servesAreas: ["0138"],
      capabilities: ["el.installation"],
      certifications: ["iso9001"],
      registrations: ["f_tax", "vat"],
    });
    const savedProfile = await getCompanyProfile(pool, orgRef);
    expect(savedProfile?.registrations).toEqual(["f_tax", "vat"]);
    const named = await persistSnapshot({
      pool,
      events,
      orgRef,
      tier: "enterprise",
      actorRef: "user-test",
      requestId: "req-profile",
    });
    expect(named.company).toBe("Pilotkund El AB");
    const latest = await listSnapshots(pool, orgRef);
    expect(latest[0]?.companyName).toBe("Pilotkund El AB");
  });
});
