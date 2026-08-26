import { afterAll, describe, expect, it } from "vitest";
import { createPool, migrateWorkspace } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import {
  getHouseIntake,
  houseOrgRefFromEnv,
  isHouseSession,
  listIntakes,
  parseIntakeForm,
  takePasswordOnce,
} from "./intakes.ts";
import { generateWorkshopPassword, slugifyCompany } from "./provision.ts";
import { registrationHold } from "./registration-hold.ts";
import { submitIntake } from "./submit-intake.ts";
import { listTasks } from "./tasks.ts";
import { ownerDatabaseUrl } from "../platform/env.ts";
import { DEMO_ORG_NUMBER } from "../rita/request.ts";

describe("self-service registration domain", () => {
  it("refuses a form with a broken organisation number", () => {
    const form = new FormData();
    form.set("companyName", "Bilia Personbilar AB");
    form.set("contactName", "Anna Inköp");
    form.set("contactEmail", "anna@bilia.se");
    form.set("termsAccepted", "on");
    form.append("modules", "tyra");
    form.set("orgNumber", "556000-0000");
    expect(() => parseIntakeForm(form, "pixdrift:org:org-exempelbolaget")).toThrow(/stämmer inte/);
  });

  it("refuses a form that skips the terms box", () => {
    const form = new FormData();
    form.set("companyName", "Bilia Personbilar AB");
    form.set("contactName", "Anna Inköp");
    form.set("contactEmail", "anna@bilia.se");
    form.append("modules", "tyra");
    expect(() => parseIntakeForm(form, "pixdrift:org:org-exempelbolaget")).toThrow(/villkor/i);
  });

  it("refuses a registration without modules", () => {
    const form = new FormData();
    form.set("companyName", "Bilia Personbilar AB");
    form.set("contactName", "Anna Inköp");
    form.set("contactEmail", "anna@bilia.se");
    form.set("termsAccepted", "on");
    expect(() => parseIntakeForm(form, "pixdrift:org:org-exempelbolaget")).toThrow(
      /minst en modul/,
    );
  });

  it("keeps the house inbox on the house org", () => {
    expect(houseOrgRefFromEnv({})).toBe("pixdrift:org:org-exempelbolaget");
    expect(isHouseSession("pixdrift:org:org-exempelbolaget")).toBe(true);
    expect(isHouseSession("pixdrift:org:org-holm-dack-umea-ab")).toBe(false);
    expect(isHouseSession(null)).toBe(false);
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
  form.set("orgNumber", DEMO_ORG_NUMBER);
  form.set("contactName", "Test Inköp");
  form.set("contactEmail", email);
  form.set("contactTitle", "IT-inköp");
  form.append("modules", "tyra");
  form.append("modules", "ekonomi");
  form.set("termsAccepted", "on");
  return form;
}

live("kansli.intakes (live Postgres)", () => {
  const pool = createPool(APP!, { applicationName: "kansli-intake-test", max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  it("registers a year: login plus ten instalment invoices with the order spec attached", async () => {
    await migrateWorkspace({ ownerUrl: OWNER!, root: process.cwd(), appRole: "pixdrift_app" });
    const events = new EventLog(pool);
    const email = `inkop-${Date.now()}@bilia-test.se`;
    const result = await submitIntake({
      pool,
      events,
      form: filledForm(email),
      ownerUrl: ownerDatabaseUrl() ?? OWNER,
      houseOrgRef: `pixdrift:org:intake-house-${Date.now()}`,
    });

    expect(result.intake.companyName).toBe("Bilia Testverkstad AB");
    expect(result.intake.modules).toEqual(["tyra", "ekonomi"]);
    // TYRA 349 + Ekonomi 349 = 698 kr net → 872,50 kr gross per instalment.
    expect(result.intake.monthlyNetOre).toBe(69_800);
    expect(result.provision?.status).toBe("created");
    expect(result.passwordOnce).toMatch(/-/);
    expect(result.intake.blocked).toEqual([]);

    // All ten invoices issued at once, one row each, spec attached to every one.
    expect(result.invoices).toHaveLength(10);
    expect(result.intake.invoiceNumbers).toHaveLength(10);
    expect(result.invoice?.number).toBe(result.invoices[0]!.number);
    for (const [index, item] of result.invoices.entries()) {
      expect(item.status).toBe("issued");
      expect(item.grossOre).toBe(87_250);
      expect(item.lines).toHaveLength(1);
      expect(item.lines[0]!.description).toContain(`del ${index + 1} av 10`);
      expect(item.attachmentText).toContain("ORDERSPECIFIKATION — PIXDRIFT");
      expect(item.attachmentText).toContain("BETALPLAN");
      expect(item.dueAt).not.toBeNull();
    }
    // Due dates spread across the year: first ~10 days, last ~280 days out.
    const daysOut = (iso: string) => Math.round((Date.parse(iso) - Date.now()) / 86_400_000);
    expect(daysOut(result.invoices[0]!.dueAt!)).toBeGreaterThanOrEqual(9);
    expect(daysOut(result.invoices[0]!.dueAt!)).toBeLessThanOrEqual(10);
    expect(daysOut(result.invoices[9]!.dueAt!)).toBeGreaterThanOrEqual(279);
    expect(daysOut(result.invoices[9]!.dueAt!)).toBeLessThanOrEqual(280);

    const once = await takePasswordOnce(pool, result.intake.id);
    expect(once).toBe(result.passwordOnce);
    expect(await takePasswordOnce(pool, result.intake.id)).toBeNull();

    const house = result.intake.houseOrgRef!;
    const listed = await listIntakes(pool, house);
    expect(listed.some((row) => row.id === result.intake.id)).toBe(true);
    expect(await listIntakes(pool, "pixdrift:org:other-house")).toEqual([]);
    expect(await getHouseIntake(pool, house, result.intake.id)).not.toBeNull();
    expect(await getHouseIntake(pool, "pixdrift:org:other-house", result.intake.id)).toBeNull();

    const houseTasks = await listTasks(pool, house);
    expect(houseTasks.some((row) => row.title.startsWith("Ny registrering:"))).toBe(true);
    const workshopTasks = result.provision?.orgRef
      ? await listTasks(pool, result.provision.orgRef)
      : [];
    expect(workshopTasks.some((row) => row.title.startsWith("Ny registrering:"))).toBe(false);

    // Inside the 10-day window nothing is held; force the invoice overdue and it is.
    const orgRef = result.provision!.orgRef;
    expect(await registrationHold(pool, orgRef)).toBeNull();
    await pool.query(
      `update ekonomi.invoices set due_at = now() - interval '1 day' where id = $1`,
      [result.invoice!.id],
    );
    const hold = await registrationHold(pool, orgRef);
    expect(hold?.invoiceNumber).toBe(result.invoice!.number);
    expect(hold?.grossOre).toBe(87_250);
    // Settle it and the hold lifts.
    await pool.query(
      `update ekonomi.invoices set status = 'paid', paid_ore = gross_ore where id = $1`,
      [result.invoice!.id],
    );
    expect(await registrationHold(pool, orgRef)).toBeNull();
  });
});
