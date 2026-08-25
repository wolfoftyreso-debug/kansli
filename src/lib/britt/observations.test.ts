import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import {
  addObservation,
  listObservations,
  setObservationAssignee,
  setObservationStatus,
} from "./observations.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("britt.observations (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "britt-obs-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("filters, assigns, closes and reopens without inventing a finding", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:britt-obs-${Date.now()}`;
    const first = await addObservation({
      pool,
      events,
      orgRef,
      actorRef: "user-a",
      title: "Kolla kassan",
      body: "Manuell anteckning",
      requestId: "req-b1",
    });
    await addObservation({
      pool,
      events,
      orgRef,
      actorRef: "user-a",
      title: "Andra",
      body: "",
      requestId: "req-b2",
    });
    await setObservationAssignee({
      pool,
      orgRef,
      id: first.id,
      assigneeRef: "user-a",
    });
    await setObservationStatus({ pool, orgRef, id: first.id, status: "done" });
    expect(await listObservations(pool, orgRef, { status: "open" })).toHaveLength(1);
    expect(await listObservations(pool, orgRef, { status: "done" })).toHaveLength(1);
    expect(
      (await listObservations(pool, orgRef, { assigneeRef: "user-a" })).map((row) => row.id),
    ).toEqual([first.id]);
    await setObservationStatus({ pool, orgRef, id: first.id, status: "open" });
    const reopened = await listObservations(pool, orgRef, { status: "open" });
    expect(reopened.some((row) => row.id === first.id && row.assigneeRef === "user-a")).toBe(true);
    expect(first).not.toHaveProperty("finding");
  });
});
