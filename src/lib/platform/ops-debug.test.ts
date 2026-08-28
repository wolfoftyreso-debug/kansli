import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { loadLastErrors, loadOpsQueues, loadRuntimeDebug, lookupOpsDebug } from "./ops-debug.ts";
import { isSecretKey, sanitizePayload } from "./ops-debug-view.ts";
import { loadOpsSnapshot } from "./ops.ts";
import { bindOrgPool } from "./tenancy.ts";

describe("ops debug sanitize", () => {
  it("hides secret keys and keeps ordinary text", () => {
    expect(isSecretKey("api_key")).toBe(true);
    expect(isSecretKey("password")).toBe(true);
    expect(isSecretKey("title")).toBe(false);
    expect(
      sanitizePayload({
        title: "Förfallen faktura",
        token: "super-secret",
        nested: { authorization: "Bearer abc", reason: "saknas" },
      }),
    ).toEqual({
      title: "Förfallen faktura",
      token: "[dold]",
      nested: { authorization: "[dold]", reason: "saknas" },
    });
  });

  it("exposes runtime marks without secret values", () => {
    const marks = loadRuntimeDebug({
      VERCEL_ENV: "preview",
      APP_ENV: "dev",
      PIXDRIFT_SEED_DEMO: "true",
      CRON_SECRET: "set",
      APP_SESSION_SECRET: "set",
      COOKIE_SECURE: "false",
    });
    expect(marks.mark).toBe("preview");
    expect(marks.hardened).toBe(false);
    expect(marks.seedDemo).toBe(true);
    expect(marks.cronSet).toBe(true);
    expect(marks.smsSet).toBe(false);
    expect(marks.ttsSet).toBe(false);
    expect(marks.sessionSecretSet).toBe(true);
    expect(marks.cookieSecure).toBe(false);
    expect(JSON.stringify(marks)).not.toContain("super-secret");
    expect(marks).not.toHaveProperty("CRON_SECRET");
    expect(marks).not.toHaveProperty("APP_SESSION_SECRET");
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("ops debug (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ops-debug-test", max: 4 });

  afterAll(async () => {
    await pool.end();
  });

  it("finds a request-id and keeps another workshop off the row", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const shopA = `pixdrift:org:dbg-a-${Date.now()}`;
    const shopB = `pixdrift:org:dbg-b-${Date.now()}`;
    const boundA = bindOrgPool(pool, shopA);
    const boundB = bindOrgPool(pool, shopB);
    const eventsA = new EventLog(boundA);
    const requestId = `dbg-req-${Date.now()}`;
    const outboxId = `dbg-sms-${Date.now()}`;

    await eventsA.publish({
      system: "tyra",
      kind: "tyra.reminder.blocked",
      orgRef: shopA,
      actorKind: "system",
      subjectRef: `tyra:outbox:${outboxId}`,
      requestId,
      payload: { reason: "no_delivery_adapter", token: "should-hide" },
    });
    await boundA.query(
      `insert into ekonomi.sales_alert_outbox
         (id, org_ref, invoice_id, channel, recipient, body, status, last_error)
       values ($1,$2,null,'sms','+46701234567','Sälj gick inte','FAILED','ingen leverantör')`,
      [outboxId, shopA],
    );

    const found = await lookupOpsDebug(boundA, { q: requestId, scope: "org", orgRef: shopA });
    expect(found.events).toHaveLength(1);
    expect(found.events[0]?.requestId).toBe(requestId);
    expect(found.events[0]?.payload).toMatchObject({
      reason: "no_delivery_adapter",
      token: "[dold]",
    });

    const byOutbox = await lookupOpsDebug(boundA, { q: outboxId, scope: "org", orgRef: shopA });
    expect(byOutbox.outbox.some((row) => row.id === outboxId && row.source === "sales")).toBe(true);

    const other = await lookupOpsDebug(boundB, { q: requestId, scope: "org", orgRef: shopB });
    expect(other.events).toHaveLength(0);
    expect(other.outbox).toHaveLength(0);

    const house = await lookupOpsDebug(pool, {
      q: requestId,
      scope: "house",
      orgRef: "pixdrift:org:org-exempelbolaget",
    });
    expect(house.events).toHaveLength(1);

    const snapshot = await loadOpsSnapshot(boundA, { orgRef: shopA, scope: "org" });
    expect(snapshot.queues.sales.failed).toBeGreaterThanOrEqual(1);
    expect(snapshot.lastErrors.some((row) => row.requestId === requestId)).toBe(true);
    expect(snapshot.runtimeDebug.mark).toMatch(/production|preview|local/);
    expect(snapshot.notices.some((item) => item.id === "reminders_blocked")).toBe(false);

    const queues = await loadOpsQueues(boundA, "org", shopA);
    expect(queues.sales.failed).toBeGreaterThanOrEqual(1);
    const errors = await loadLastErrors(boundA, "org", shopA);
    expect(errors.some((row) => row.kind === "tyra.reminder.blocked")).toBe(true);
  });
});
