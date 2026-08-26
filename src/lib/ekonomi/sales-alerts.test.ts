import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createDraftInvoice, issueInvoice } from "./invoices.ts";
import { getSalesAlertSettings, listSalesAlerts, saveSalesAlertSettings } from "./sales-alerts.ts";

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("sales alerts (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ekonomi-alerts-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("saves a phone number and enqueues a blocked SMS when no vendor is configured", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const username = process.env.ELKS_API_USERNAME;
    const password = process.env.ELKS_API_PASSWORD;
    const user = process.env.ELKS_API_USER;
    delete process.env.ELKS_API_USERNAME;
    delete process.env.ELKS_API_PASSWORD;
    delete process.env.ELKS_API_USER;

    const events = new EventLog(pool);
    const orgRef = `pixdrift:org:ekonomi-sms-${Date.now()}`;
    const saved = await saveSalesAlertSettings({
      pool,
      orgRef,
      phone: "070-123 45 67",
      enabled: true,
    });
    expect(saved.phone).toBe("+46701234567");
    expect((await getSalesAlertSettings(pool, orgRef))?.enabled).toBe(true);

    const draft = await createDraftInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      customerName: "Holm AB",
      lines: [
        {
          description: "Hjulskifte",
          quantity: 1,
          unitNetOre: 10000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: "req-sms-1",
    });
    await issueInvoice({
      pool,
      events,
      orgRef,
      actorRef: "user-test",
      invoiceId: draft.id,
      requestId: "req-sms-2",
    });
    const alerts = await listSalesAlerts(pool, orgRef);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.status).toBe("BLOCKED");
    expect(alerts[0]?.body).toContain("INV-");
    expect(alerts[0]?.body).toContain("Holm AB");

    if (username) process.env.ELKS_API_USERNAME = username;
    if (password) process.env.ELKS_API_PASSWORD = password;
    if (user) process.env.ELKS_API_USER = user;
  });
});
