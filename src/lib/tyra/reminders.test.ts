import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createCase } from "./cases.ts";
import {
  buildReminderMessage,
  chooseChannel,
  enqueueReminder,
  listOutbox,
  processDueOutbox,
} from "./reminders.ts";

describe("reminder copy", () => {
  it("signs with the organisation name and never says Tyra", () => {
    const message = buildReminderMessage({
      kind: "season",
      targetSeason: "winter",
      customerName: "Anna Andersson",
      registrationNumber: "ABC123",
      make: "Volvo",
      model: "XC60",
      senderName: "Exempelbolaget AB",
    });
    expect(message.body).toContain("/ Exempelbolaget AB");
    expect(message.body.toLowerCase()).not.toContain("tyra");
    expect(message.subject.toLowerCase()).not.toContain("tyra");
  });

  it("prefers sms when a phone exists", () => {
    expect(chooseChannel({ phone: "070123", email: "a@b.se" })).toEqual({
      channel: "sms",
      recipient: "070123",
    });
    expect(chooseChannel({})).toBeNull();
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("TYRA outbox (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "tyra-outbox-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("enqueues then blocks delivery when no send adapter exists", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:tyra-outbox-${Date.now()}`;
    const created = await createCase({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Anna Andersson",
      registrationNumber: "OUT001",
      phone: "0700000000",
      intent: "TIRE_SWAP_APPOINTMENT",
      operations: ["WHEEL_WASH"],
      requestId: "req-outbox-1",
    });
    const message = buildReminderMessage({
      kind: "season",
      targetSeason: "winter",
      customerName: "Anna Andersson",
      registrationNumber: "OUT001",
      senderName: "Exempelbolaget AB",
    });
    const queued = await enqueueReminder({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerId: created.customerId,
      vehicleId: created.vehicleId,
      reminderKey: `season:winter:2026:OUT001`,
      channel: "sms",
      recipient: "0700000000",
      subject: message.subject,
      body: message.body,
      requestId: "req-outbox-2",
    });
    expect(queued.status).toBe("PENDING");
    const again = await enqueueReminder({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerId: created.customerId,
      vehicleId: created.vehicleId,
      reminderKey: `season:winter:2026:OUT001`,
      channel: "sms",
      recipient: "0700000000",
      subject: message.subject,
      body: message.body,
      requestId: "req-outbox-2b",
    });
    expect(again.id).toBe(queued.id);

    const processed = await processDueOutbox({
      pool,
      events,
      orgRef,
      requestId: "req-outbox-3",
    });
    expect(processed.blocked).toBe(1);
    const rows = await listOutbox(pool, orgRef);
    expect(rows[0]?.status).toBe("BLOCKED");
    expect(rows[0]?.lastError).toMatch(/skickas inte/);
    expect(await events.list({ orgRef, kind: "tyra.reminder.enqueued" })).toHaveLength(1);
    expect(await events.list({ orgRef, kind: "tyra.reminder.blocked" })).toHaveLength(1);
  });
});
