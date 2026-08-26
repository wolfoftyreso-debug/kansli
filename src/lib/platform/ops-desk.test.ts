import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createDraftInvoice } from "../ekonomi/invoices.ts";
import { addTask } from "../kansli/tasks.ts";
import {
  alarmActive,
  alarmSmsBody,
  buildOpsNotices,
  loadOpsDesk,
  raiseOpsAlarms,
  saveOpsSmsRoutes,
  type OpsDeskFacts,
} from "./ops-desk.ts";
import { bindOrgPool } from "./tenancy.ts";

const emptyFacts = (): OpsDeskFacts => ({
  ledger: { openCount: 0, notDueOre: 0, overdueOre: 0, overdueCount: 0, overdue: [] },
  support: { open: 0, observations: 0, tasks: 0, cases: 0, intakes: 0, items: [] },
  smsFailed: 0,
  remindersBlocked: 0,
  blockedGates: 0,
  databaseDown: false,
  vendor: false,
});

describe("ops desk notices", () => {
  it("puts overdue reskontra and open cases on the board", () => {
    const facts = emptyFacts();
    facts.ledger.overdueOre = 12500;
    facts.ledger.overdueCount = 1;
    facts.support.open = 2;
    facts.support.cases = 2;
    const notices = buildOpsNotices({ facts, routes: [] });
    expect(notices.map((item) => item.id)).toContain("overdue");
    expect(notices.map((item) => item.id)).toContain("support");
    expect(notices.find((item) => item.id === "overdue")?.href).toBe("/ekonomi");
  });

  it("warns when TYRA reminders are blocked", () => {
    const facts = emptyFacts();
    facts.remindersBlocked = 3;
    const notices = buildOpsNotices({ facts, routes: [] });
    expect(notices.find((item) => item.id === "reminders_blocked")?.href).toBe("/tyra");
  });

  it("warns when a route is on but the vendor is missing", () => {
    const facts = emptyFacts();
    facts.vendor = false;
    const notices = buildOpsNotices({
      facts,
      routes: [
        {
          kind: "overdue",
          phone: "+46701234567",
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
      ],
    });
    expect(notices.some((item) => item.id === "sms_vendor")).toBe(true);
  });

  it("writes a short Swedish alarm body in kronor", () => {
    const facts = emptyFacts();
    facts.ledger.overdueOre = 10050;
    expect(alarmSmsBody("overdue", facts)).toMatch(/100,50 kr/);
    expect(alarmActive("overdue", facts)).toBe(true);
    expect(alarmActive("support", facts)).toBe(false);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("ops desk (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ops-desk-test", max: 4 });

  afterAll(async () => {
    await pool.end();
  });

  it("keeps workshop reskontra and tasks off another workshop", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const shopA = `pixdrift:org:desk-a-${Date.now()}`;
    const shopB = `pixdrift:org:desk-b-${Date.now()}`;
    const boundA = bindOrgPool(pool, shopA);
    const boundB = bindOrgPool(pool, shopB);
    const eventsA = new EventLog(boundA);

    const draft = await createDraftInvoice({
      pool: boundA,
      events: eventsA,
      orgRef: shopA,
      actorRef: "desk-a",
      customerName: "Förfallen kund",
      lines: [
        {
          description: "Däck",
          quantity: 1,
          unitNetOre: 20000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: `desk-a-${Date.now()}`,
    });
    await boundA.query(
      `update ekonomi.invoices
          set status = 'issued', issued_at = now(), due_at = now() - interval '3 days'
        where org_ref = $1 and id = $2`,
      [shopA, draft.id],
    );
    await addTask(boundA, {
      orgRef: shopA,
      title: "Ring kunden",
      owner: "Anna",
      createdBy: "desk-a",
    });

    const house = await loadOpsDesk(pool, {
      orgRef: "pixdrift:org:org-exempelbolaget",
      scope: "house",
      blockedGates: 0,
      databaseDown: false,
    });
    const a = await loadOpsDesk(boundA, {
      orgRef: shopA,
      scope: "org",
      blockedGates: 0,
      databaseDown: false,
    });
    const b = await loadOpsDesk(boundB, {
      orgRef: shopB,
      scope: "org",
      blockedGates: 0,
      databaseDown: false,
    });

    expect(a.ledger.overdueCount).toBe(1);
    expect(a.ledger.overdueOre).toBe(25000);
    expect(a.support.tasks).toBeGreaterThanOrEqual(1);
    expect(a.notices.some((item) => item.id === "overdue")).toBe(true);
    expect(b.ledger.overdueCount).toBe(0);
    expect(b.support.tasks).toBe(0);
    expect(house.ledger.overdueOre).toBeGreaterThanOrEqual(25000);

    const sent: string[] = [];
    const routes = await saveOpsSmsRoutes({
      pool: boundA,
      orgRef: shopA,
      phone: "070-123 45 67",
      enabled: ["overdue"],
    });
    const first = await raiseOpsAlarms({
      pool: boundA,
      orgRef: shopA,
      facts: { ...a.facts, vendor: true },
      routes,
      deliver: true,
      send: async (payload) => {
        sent.push(payload.body);
        return { ok: true, providerRef: "test-sms", reason: null };
      },
    });
    const second = await raiseOpsAlarms({
      pool: boundA,
      orgRef: shopA,
      facts: { ...a.facts, vendor: true },
      routes,
      deliver: true,
      send: async (payload) => {
        sent.push(payload.body);
        return { ok: true, providerRef: "test-sms-2", reason: null };
      },
    });
    const dry = await raiseOpsAlarms({
      pool: boundA,
      orgRef: shopA,
      facts: { ...a.facts, vendor: true },
      routes,
      deliver: false,
      send: async () => {
        throw new Error("snapshot must not send");
      },
    });

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    expect(sent).toHaveLength(1);
    expect(dry).toEqual({ sent: 0, skipped: 0, blocked: 0 });
    expect(routes.find((route) => route.kind === "overdue")?.enabled).toBe(true);
  });
});
