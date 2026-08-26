import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createDraftInvoice } from "../ekonomi/invoices.ts";
import { bindOrgPool } from "./tenancy.ts";
import { fillHourSeries, loadOpsSnapshot, opsScopeFor, unexpectedTables } from "./ops.ts";
import { seriesChangePct, seriesTotal } from "./ops-view.ts";
import { PRODUCT_TABLES } from "./structure.ts";

describe("ops scope", () => {
  it("treats the house org as fleet scope", () => {
    expect(opsScopeFor("pixdrift:org:org-exempelbolaget")).toBe("house");
    expect(opsScopeFor("pixdrift:org:org-holm-dack-umea-ab")).toBe("org");
    expect(opsScopeFor(null)).toBe("org");
  });

  it("fills twenty-four hours so the overview chart has a stable axis", () => {
    const now = new Date("2026-08-26T12:30:00.000Z");
    const series = fillHourSeries([{ hour: "2026-08-26T11:00:00.000Z", n: 4 }], now);
    expect(series).toHaveLength(24);
    expect(series.at(-1)?.at).toBe("2026-08-26T12:00:00.000Z");
    expect(series.find((point) => point.at === "2026-08-26T11:00:00.000Z")?.count).toBe(4);
    expect(series.filter((point) => point.count === 0).length).toBe(23);
  });

  it("summarises the 24h window without loading Postgres", () => {
    const series = [
      { at: "2026-08-26T10:00:00.000Z", count: 2 },
      { at: "2026-08-26T11:00:00.000Z", count: 4 },
    ];
    expect(seriesTotal(series)).toBe(6);
    expect(seriesChangePct(6, 3)).toBe(100);
    expect(seriesChangePct(0, 0)).toBeNull();
    expect(seriesChangePct(4, 0)).toBe(100);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("ops snapshot (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "ops-test", max: 4 });

  afterAll(async () => {
    await pool.end();
  });

  it("measures the real schemas and hides house intakes from a workshop", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const houseRef = "pixdrift:org:org-exempelbolaget";
    const shopA = `pixdrift:org:ops-a-${Date.now()}`;
    const shopB = `pixdrift:org:ops-b-${Date.now()}`;
    const boundA = bindOrgPool(pool, shopA);
    const boundB = bindOrgPool(pool, shopB);
    const eventsA = new EventLog(boundA);
    const eventsB = new EventLog(boundB);

    await createDraftInvoice({
      pool: boundA,
      events: eventsA,
      orgRef: shopA,
      actorRef: "ops-a",
      customerName: "Verkstad A",
      lines: [
        {
          description: "Däck A",
          quantity: 1,
          unitNetOre: 10000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: `ops-a-${Date.now()}`,
    });
    await createDraftInvoice({
      pool: boundB,
      events: eventsB,
      orgRef: shopB,
      actorRef: "ops-b",
      customerName: "Verkstad B",
      lines: [
        {
          description: "Däck B",
          quantity: 1,
          unitNetOre: 20000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: `ops-b-${Date.now()}`,
    });

    const house = await loadOpsSnapshot(pool, {
      orgRef: houseRef,
      orgName: "Huset",
      scope: "house",
    });
    const shop = await loadOpsSnapshot(boundA, { orgRef: shopA, orgName: "A", scope: "org" });

    expect(house.contract.engines).toBe(1);
    expect(house.health.database).toBe("up");
    expect(house.schemas.every((schema) => schema.present)).toBe(true);
    expect(
      house.schemas.find((schema) => schema.schema === "ekonomi")?.migrations.length,
    ).toBeGreaterThan(0);
    expect(unexpectedTables(house).length).toBe(0);

    const houseInvoices = house.tables.find(
      (table) => table.schema === "ekonomi" && table.table === "invoices",
    );
    const shopInvoices = shop.tables.find(
      (table) => table.schema === "ekonomi" && table.table === "invoices",
    );
    expect(houseInvoices?.rows ?? 0).toBeGreaterThanOrEqual(2);
    expect(shopInvoices?.rows).toBe(1);

    expect(shop.tables.some((table) => table.table === "intakes")).toBe(false);
    expect(house.tables.some((table) => table.table === "intakes")).toBe(true);

    const shopEvents = shop.events.find((item) => item.system === "ekonomi");
    const houseEvents = house.events.find((item) => item.system === "ekonomi");
    expect(shopEvents?.count).toBeGreaterThanOrEqual(1);
    expect(houseEvents?.count ?? 0).toBeGreaterThanOrEqual(shopEvents?.count ?? 0);

    expect(PRODUCT_TABLES.map((item) => `${item.schema}.${item.table}`)).toContain(
      "tyra.tire_cases",
    );
    expect(house.series).toHaveLength(24);
    expect(shop.recent.length).toBeGreaterThan(0);
    expect(shop.recent[0]?.kind).toMatch(/^ekonomi\./);
    expect(house.notices).toBeDefined();
    expect(house.ledger).toBeDefined();
    expect(house.support).toBeDefined();
    expect(house.sms.routes).toHaveLength(4);
    expect(shop.sms.routes).toHaveLength(4);
  });
});
