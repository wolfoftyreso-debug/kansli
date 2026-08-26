import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { createDraftInvoice, getInvoice, listInvoices } from "../ekonomi/invoices.ts";
import { addTask, listTasks } from "../kansli/tasks.ts";
import { createCase as createAlvaCase, getCase as getAlvaCase } from "../alva/cases.ts";
import { createInquiry as createCreditaeInquiry, getInquiry } from "../creditae/inquiries.ts";
import { createCase as createTyraCase, listCases as listTyraCases } from "../tyra/cases.ts";
import { makeOrgNumber } from "./org-number.ts";
import {
  TABLES_WITHOUT_ORG_REF,
  TENANT_SCHEMAS,
  bindOrgPool,
  tableNeedsOrgRef,
} from "./tenancy.ts";

describe("tenant table rules", () => {
  it("keeps the house chart and house intakes off org_ref", () => {
    expect(tableNeedsOrgRef("ekonomi", "invoices")).toBe(true);
    expect(tableNeedsOrgRef("ekonomi", "accounts")).toBe(false);
    expect(tableNeedsOrgRef("kansli", "intakes")).toBe(false);
    expect(tableNeedsOrgRef("kansli", "schema_migrations")).toBe(false);
    expect(TABLES_WITHOUT_ORG_REF.has("kansli.intakes")).toBe(true);
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

live("multi-tenant storage (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "tenancy-test", max: 4 });

  afterAll(async () => {
    await pool.end();
  });

  it("gives every customer table org_ref and RLS", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const { rows: tables } = await pool.query<{
      table_schema: string;
      table_name: string;
      has_org: boolean;
      rls: boolean;
    }>(
      `select n.nspname as table_schema,
              c.relname as table_name,
              exists (
                select 1 from information_schema.columns col
                 where col.table_schema = n.nspname
                   and col.table_name = c.relname
                   and col.column_name = 'org_ref'
              ) as has_org,
              c.relrowsecurity as rls
         from pg_class c
         join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = any($1::text[])
          and c.relkind = 'r'
        order by 1, 2`,
      [TENANT_SCHEMAS],
    );

    const missingOrg = tables.filter(
      (row) => tableNeedsOrgRef(row.table_schema, row.table_name) && !row.has_org,
    );
    expect(missingOrg).toEqual([]);

    const missingRls = tables.filter(
      (row) => tableNeedsOrgRef(row.table_schema, row.table_name) && !row.rls,
    );
    expect(missingRls).toEqual([]);
  });

  it("keeps two workshops from reading each other's rows", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const stamp = Date.now();
    const orgA = `pixdrift:org:tenancy-a-${stamp}`;
    const orgB = `pixdrift:org:tenancy-b-${stamp}`;
    const poolA = bindOrgPool(pool, orgA);
    const poolB = bindOrgPool(pool, orgB);
    const eventsA = new EventLog(poolA);
    const eventsB = new EventLog(poolB);

    const invoiceA = await createDraftInvoice({
      pool: poolA,
      events: eventsA,
      orgRef: orgA,
      actorRef: "user-a",
      customerName: "Verkstad A",
      lines: [
        {
          description: "Hemligt A",
          quantity: 1,
          unitNetOre: 10000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: `tenancy-a-${stamp}`,
    });
    const invoiceB = await createDraftInvoice({
      pool: poolB,
      events: eventsB,
      orgRef: orgB,
      actorRef: "user-b",
      customerName: "Verkstad B",
      lines: [
        {
          description: "Hemligt B",
          quantity: 1,
          unitNetOre: 20000,
          vatRateBps: 2500,
          kind: "service",
        },
      ],
      requestId: `tenancy-b-${stamp}`,
    });

    await addTask(poolA, {
      orgRef: orgA,
      title: "Uppgift A",
      owner: "Ada",
      createdBy: "user-a",
    });
    await addTask(poolB, {
      orgRef: orgB,
      title: "Uppgift B",
      owner: "Bo",
      createdBy: "user-b",
    });

    const tyraA = await createTyraCase({
      pool: poolA,
      events: eventsA,
      orgRef: orgA,
      actorRef: "user-a",
      customerName: "Kund A",
      registrationNumber: `TEN${String(stamp).slice(-5)}A`,
      operations: ["TIRE_SWAP_FROM_STORAGE"],
      requestId: `tyra-a-${stamp}`,
    });
    const tyraB = await createTyraCase({
      pool: poolB,
      events: eventsB,
      orgRef: orgB,
      actorRef: "user-b",
      customerName: "Kund B",
      registrationNumber: `TEN${String(stamp).slice(-5)}B`,
      operations: ["TIRE_SWAP_FROM_STORAGE"],
      requestId: `tyra-b-${stamp}`,
    });

    const alvaA = await createAlvaCase({
      pool: poolA,
      events: eventsA,
      orgRef: orgA,
      actorRef: "user-a",
      complaint: "Oljud A",
      requestId: `alva-a-${stamp}`,
    });
    const alvaB = await createAlvaCase({
      pool: poolB,
      events: eventsB,
      orgRef: orgB,
      actorRef: "user-b",
      complaint: "Oljud B",
      requestId: `alva-b-${stamp}`,
    });

    const invoicesA = await listInvoices(poolA, orgA);
    const invoicesB = await listInvoices(poolB, orgB);
    expect(invoicesA.map((row) => row.id)).toContain(invoiceA.id);
    expect(invoicesA.map((row) => row.id)).not.toContain(invoiceB.id);
    expect(invoicesB.map((row) => row.id)).toContain(invoiceB.id);
    expect(invoicesB.map((row) => row.id)).not.toContain(invoiceA.id);
    expect(await getInvoice(poolA, orgA, invoiceB.id)).toBeNull();
    expect(await getInvoice(poolB, orgB, invoiceA.id)).toBeNull();

    expect((await listTasks(poolA, orgA)).map((row) => row.title)).toEqual(["Uppgift A"]);
    expect((await listTasks(poolB, orgB)).map((row) => row.title)).toEqual(["Uppgift B"]);

    expect((await listTyraCases(poolA, orgA)).map((row) => row.id)).toEqual([tyraA.id]);
    expect((await listTyraCases(poolB, orgB)).map((row) => row.id)).toEqual([tyraB.id]);

    expect(await getAlvaCase(poolA, orgA, alvaB.id)).toBeNull();
    expect(await getAlvaCase(poolB, orgB, alvaA.id)).toBeNull();

    const creditA = await createCreditaeInquiry({
      pool: poolA,
      events: eventsA,
      orgRef: orgA,
      actorRef: "user-a",
      subjectOrgNumber: makeOrgNumber(21),
      requestId: `creditae-a-${stamp}`,
    });
    const creditB = await createCreditaeInquiry({
      pool: poolB,
      events: eventsB,
      orgRef: orgB,
      actorRef: "user-b",
      subjectOrgNumber: makeOrgNumber(22),
      requestId: `creditae-b-${stamp}`,
    });
    expect(await getInquiry(poolA, orgA, creditB.id)).toBeNull();
    expect(await getInquiry(poolB, orgB, creditA.id)).toBeNull();

    const stolen = await poolA.query(`select id from ekonomi.invoices where id = $1`, [
      invoiceB.id,
    ]);
    expect(stolen.rowCount).toBe(0);

    const who = await pool.query<{ current_user: string }>("select current_user");
    expect(who.rows[0]?.current_user).not.toBe("pixdrift_owner");
  });
});
