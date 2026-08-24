import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { meetingAtFrom, parseIntakeForm, takePasswordOnce } from "./intakes.ts";
import { generateWorkshopPassword, slugifyCompany } from "./provision.ts";
import { submitIntake } from "./submit-intake.ts";
import { ownerDatabaseUrl } from "../platform/env.ts";

describe("koncernupphandling domain", () => {
  it("books the meeting ten days after now", () => {
    const now = new Date("2026-08-24T12:00:00.000Z");
    expect(meetingAtFrom(now).toISOString()).toBe("2026-09-03T12:00:00.000Z");
  });

  it("refuses a form that skips the honesty box", () => {
    const form = new FormData();
    form.set("companyName", "Bilia Personbilar AB");
    form.set("contactName", "Anna Inköp");
    form.set("contactEmail", "anna@bilia.se");
    expect(() => parseIntakeForm(form, "pixdrift:org:org-exempelbolaget")).toThrow(/ärlighet/i);
  });

  it("slugifies a Swedish company name", () => {
    expect(slugifyCompany("Bilia Personbilar AB")).toBe("bilia-personbilar-ab");
    expect(generateWorkshopPassword()).toMatch(
      /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/,
    );
  });
});

const OWNER = process.env.PIXDRIFT_TEST_OWNER_URL ?? process.env.PIXDRIFT_DB_OWNER_URL;
const APP = process.env.PIXDRIFT_TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const live = OWNER && APP ? describe : describe.skip;

function filledForm(email: string): FormData {
  const form = new FormData();
  form.set("companyName", "Bilia Testverkstad AB");
  form.set("orgNumber", "556010-1010");
  form.set("contactName", "Test Inköp");
  form.set("contactEmail", email);
  form.set("contactTitle", "IT-inköp");
  form.set("sites", "Göteborg, Stockholm");
  form.set("brands", "Volkswagen, Audi");
  form.set("dms", "Autovista");
  form.set("economySystem", "Fortnox");
  form.set("tireHotel", "Eget Excel");
  form.set("smsProvider", "Ingen");
  form.set("identitySystem", "Entra");
  form.set("environment", "cloud");
  form.set("oidcNotes", "Whitelist mermaid.pixdrift.se");
  form.append("demoModules", "tyra");
  form.append("demoModules", "ekonomi");
  form.set("honestyAccepted", "on");
  form.set("provisionAccount", "on");
  form.set("issueInvoice", "on");
  form.set("invoiceKronor", "2500");
  return form;
}

live("kansli.intakes (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "kansli-intake-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("persists the brief, provisions a login, and issues a 10-day invoice", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const email = `inkop-${Date.now()}@bilia-test.se`;
    const result = await submitIntake({
      pool,
      events,
      form: filledForm(email),
      ownerUrl: ownerDatabaseUrl() ?? OWNER,
      houseOrgRef: `pixdrift:org:intake-house-${Date.now()}`,
      now: new Date("2026-08-24T08:00:00.000Z"),
    });

    expect(result.intake.companyName).toBe("Bilia Testverkstad AB");
    expect(result.intake.meetingAt.startsWith("2026-09-03")).toBe(true);
    expect(result.intake.demoModules).toEqual(["tyra", "ekonomi"]);
    expect(result.provision?.status).toBe("created");
    expect(result.passwordOnce).toMatch(/-/);
    expect(result.invoice?.status).toBe("issued");
    expect(result.invoice?.grossOre).toBe(312_500);
    expect(result.intake.blocked).toEqual([]);

    const once = await takePasswordOnce(pool, result.intake.id);
    expect(once).toBe(result.passwordOnce);
    expect(await takePasswordOnce(pool, result.intake.id)).toBeNull();
  });
});
