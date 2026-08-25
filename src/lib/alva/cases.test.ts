import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createCase, getCase, listCases, setCaseNotes, setCaseStatus } from "./cases.ts";
import {
  buildProtocolFacts,
  recordProtocolMeasurement,
  recordProtocolObservation,
} from "./protocol.ts";

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
      area: "motor",
      mileageKm: 184000,
      desiredOutcome: "Hitta källan till oljudet",
      requestId: "req-alva-1",
    });

    expect(created.status).toBe("open");
    expect(created).not.toHaveProperty("diagnosis");
    expect(created).not.toHaveProperty("findings");

    const listed = await listCases(pool, orgRef);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.complaint).toBe("Oljud vid kallstart");
    expect(listed[0]?.area).toBe("motor");

    const detail = await getCase(pool, orgRef, created.id);
    expect(detail?.mileageKm).toBe(184000);
    expect(detail?.desiredOutcome).toMatch(/oljudet/);

    const published = await events.list({ orgRef, kind: "alva.case.created" });
    expect(published).toHaveLength(1);
    expect(published[0]?.payload["note"]).toMatch(/inte inkopplad/);
    expect(published[0]?.payload["complaintExcerpt"]).toMatch(/Oljud/);
    expect(published[0]?.payload).not.toHaveProperty("diagnosis");

    await setCaseNotes({
      pool,
      orgRef,
      caseId: created.id,
      notes: "Kallstart vid -4 C.",
    });
    await setCaseStatus({ pool, orgRef, caseId: created.id, status: "in_progress" });
    const observed = await recordProtocolObservation({
      pool,
      orgRef,
      actorRef: "user-test",
      caseId: created.id,
      label: "Oljud reproducerbart",
      value: "yes",
    });
    const measured = await recordProtocolMeasurement({
      pool,
      orgRef,
      actorRef: "user-test",
      caseId: created.id,
      name: "Kylvätska",
      value: 92,
      unit: "C",
    });
    expect(observed).not.toHaveProperty("diagnosis");
    expect(measured.value).toBe(92);

    const updated = await getCase(pool, orgRef, created.id);
    expect(updated?.technicianNotes).toBe("Kallstart vid -4 C.");
    expect(updated?.status).toBe("in_progress");
    expect(updated).not.toHaveProperty("diagnosis");
    expect(updated).not.toHaveProperty("findings");

    const facts = buildProtocolFacts({
      item: updated!,
      observations: [observed],
      measurements: [measured],
    });
    expect(facts.diagnosis).toBeNull();
    expect(facts.diagnosisEngine).toBeNull();
    expect(facts).not.toHaveProperty("findings");
  });
});
