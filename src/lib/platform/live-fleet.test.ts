/**
 * Live fleet: 20 workshops through provision → product writes → login → API → HTML.
 * Writes /opt/cursor/artifacts/live-fleet-report.json. Does not print passwords.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createPool } from "@pixdrift/db";
import { EventLog } from "@pixdrift/events";
import { addObservation } from "../britt/observations.ts";
import { createCase as createAlvaCase } from "../alva/cases.ts";
import { addTask } from "../kansli/tasks.ts";
import { submitIntake } from "../kansli/submit-intake.ts";
import { createAgreement } from "../irma/agreements.ts";
import { requestAnalysis } from "../rita/analyses.ts";
import { DEMO_ORG_NUMBER } from "../rita/request.ts";
import { persistSnapshot } from "../tora/persist.ts";
import { upsertCompanyProfile } from "../tora/profile.ts";
import { createCase as createTyraCase } from "../tyra/cases.ts";
import { issueHubLink } from "../tyra/hub.ts";
import { markQuoteInvoiced, saveQuoteDraft } from "../tyra/quotes.ts";
import { bookTyraQuote } from "../ekonomi/tyra-sales.ts";

const BASE = process.env.LIVE_FLEET_BASE ?? "http://127.0.0.1:3000";
const APP = process.env.DATABASE_URL;
const OWNER = process.env.PIXDRIFT_DB_OWNER_URL;

const WORKSHOPS = [
  "Holm Däck Umeå AB",
  "Norrdäck Luleå AB",
  "Bottenvikens Däck AB",
  "Skellefteå Hjul AB",
  "Sundsvall Däckhotell AB",
  "Gävle Gummi AB",
  "Uppsala Däckservice AB",
  "Västerås Hjul AB",
  "Örebro Däck AB",
  "Linköping Däck AB",
  "Jönköping Hjul AB",
  "Växjö Däck AB",
  "Kalmar Gummi AB",
  "Karlskrona Däck AB",
  "Malmö Däckhotell AB",
  "Helsingborg Hjul AB",
  "Halmstad Däck AB",
  "Göteborg Väst Däck AB",
  "Karlstad Däck AB",
  "Östersund Hjul AB",
] as const;

const LIMIT = Math.min(
  WORKSHOPS.length,
  Math.max(1, Number(process.env.LIVE_FLEET_LIMIT ?? WORKSHOPS.length) || WORKSHOPS.length),
);

function isRedirect(status: number): boolean {
  return status === 302 || status === 303 || status === 307 || status === 308;
}

type Check = { name: string; ok: boolean; detail: string };

type CompanyReport = {
  index: number;
  companyName: string;
  email: string;
  orgRef: string | null;
  invoiceNumber: string | null;
  checks: Check[];
};

class CookieJar {
  private readonly store = new Map<string, string>();

  apply(headers: Headers) {
    const raw = headers.getSetCookie?.() ?? [];
    for (const line of raw) {
      const pair = line.split(";", 1)[0];
      if (!pair) continue;
      const eq = pair.indexOf("=");
      if (eq < 1) continue;
      this.store.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }

  header(): string {
    return [...this.store.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

async function request(
  jar: CookieJar,
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; text: string; json: unknown; headers: Headers }> {
  const headers = new Headers(init.headers);
  const cookie = jar.header();
  if (cookie) headers.set("cookie", cookie);
  const res = await fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
  jar.apply(res.headers);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, text, json, headers: res.headers };
}

async function login(email: string, password: string): Promise<CookieJar> {
  const jar = new CookieJar();
  const start = await request(jar, `/api/auth/login?next=${encodeURIComponent("/kansli")}`);
  const authorize = start.headers.get("location");
  if (!isRedirect(start.status) || !authorize) {
    throw new Error(`login start ${String(start.status)} ${start.text.slice(0, 80)}`);
  }
  const url = new URL(authorize, BASE);
  const form = new URLSearchParams();
  for (const [key, value] of url.searchParams) form.set(key, value);
  form.set("email", email);
  form.set("password", password);
  const posted = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form,
    redirect: "manual",
  });
  jar.apply(posted.headers);
  const callback = posted.headers.get("location");
  if (!isRedirect(posted.status) || !callback) {
    throw new Error(`authorize ${String(posted.status)}`);
  }
  const cbPath = callback.startsWith("http")
    ? new URL(callback).pathname + new URL(callback).search
    : callback;
  const done = await request(jar, cbPath);
  if (!isRedirect(done.status)) throw new Error(`callback ${String(done.status)}`);
  const next = done.headers.get("location");
  if (next) {
    const nextPath = next.startsWith("http") ? new URL(next).pathname + new URL(next).search : next;
    await request(jar, nextPath);
  }
  return jar;
}

function check(name: string, ok: boolean, detail: string): Check {
  return { name, ok, detail };
}

function filledForm(company: string, email: string, orgNumber: string): FormData {
  const form = new FormData();
  form.set("companyName", company);
  form.set("orgNumber", orgNumber);
  form.set("contactName", "Test Kontakt");
  form.set("contactEmail", email);
  form.set("contactTitle", "Verkstadschef");
  form.set("sites", "En anläggning");
  form.set("brands", "Volvo, Kia");
  form.set("honestyAccepted", "on");
  form.set("provisionAccount", "on");
  form.set("issueInvoice", "on");
  form.set("invoiceKronor", "2500");
  form.append("demoModules", "tyra");
  form.append("demoModules", "ekonomi");
  form.append("demoModules", "irma");
  return form;
}

async function runFleet(): Promise<{ passed: number; companies: number; failures: string[] }> {
  const stamp = Date.now();
  if (!APP || !OWNER) throw new Error("DATABASE_URL och PIXDRIFT_DB_OWNER_URL krävs.");
  const pool = createPool(APP, { applicationName: "live-fleet", max: 6 });
  const events = new EventLog(pool);
  const reports: CompanyReport[] = [];
  const failures: string[] = [];

  const schemas = await pool.query<{ nspname: string }>(
    `select nspname from pg_namespace
      where nspname in ('platform','kansli','ekonomi','tora','rita','britt','irma','tyra','alva')
      order by 1`,
  );
  if (schemas.rowCount !== 9) {
    throw new Error(`saknade scheman: ${schemas.rows.map((r) => r.nspname).join(",")}`);
  }

  for (let i = 0; i < LIMIT; i += 1) {
    const companyName = WORKSHOPS[i]!;
    const n = String(i + 1).padStart(2, "0");
    const email = `liveprov${n}-${stamp}@pixdrift-test.se`;
    const orgNumber = `5561${n}-${String(1000 + i).slice(-4)}`;
    const report: CompanyReport = {
      index: i + 1,
      companyName,
      email,
      orgRef: null,
      invoiceNumber: null,
      checks: [],
    };
    try {
      const intake = await submitIntake({
        pool,
        events,
        form: filledForm(companyName, email, orgNumber),
        ownerUrl: OWNER,
        houseOrgRef: "pixdrift:org:org-exempelbolaget",
      });
      if (!intake.provision?.orgRef || !intake.passwordOnce || !intake.invoice) {
        throw new Error(
          `provision ofullständig: ${intake.intake.blocked.join("; ") || "saknar konto/faktura"}`,
        );
      }
      const orgRef = intake.provision.orgRef;
      const password = intake.passwordOnce;
      report.orgRef = orgRef;
      report.invoiceNumber = intake.invoice.number;

      const tyra = await createTyraCase({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        customerName: `Kund ${n} ${companyName}`,
        registrationNumber: `LP${n}${String(stamp).slice(-3)}`,
        make: "Volvo",
        model: "V60",
        operations: ["TIRE_SWAP_FROM_STORAGE"],
        requestId: `fleet-tyra-${n}-${stamp}`,
      });
      const quote = await saveQuoteDraft({
        pool,
        orgRef,
        tireCaseId: tyra.id,
        title: `Sommardäck ${n}`,
        quantity: 4,
        unitCostOre: 120_000,
        installationOrePerTyre: 15_000,
        environmentalOrePerTyre: 2_500,
        markupPercent: 20,
      });
      const booked = await bookTyraQuote({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        quoteId: quote.id,
        requestId: `fleet-book-${n}-${stamp}`,
      });
      await markQuoteInvoiced(pool, orgRef, quote.id);
      const hub = await issueHubLink({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        customerId: tyra.customerId,
        requestId: `fleet-hub-${n}-${stamp}`,
      });

      const agreement = await createAgreement({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        title: `Däckavtal ${companyName}`,
        counterparty: `Kund ${n}`,
        requestId: `fleet-irma-${n}-${stamp}`,
      });

      await createAlvaCase({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        complaint: `Oljud ${n} hos ${companyName}`,
        vehicleRef: `LP${n}${String(stamp).slice(-3)}`,
        requestId: `fleet-alva-${n}-${stamp}`,
      });

      await addObservation({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        title: `Uppföljning ${companyName}`,
        body: `Liveprov ${n} är inne.`,
        requestId: `fleet-britt-${n}-${stamp}`,
      });

      await upsertCompanyProfile({
        pool,
        orgRef,
        name: companyName,
        employees: 8 + i,
        annualRevenueSek: 4_000_000 + i * 100_000,
        servesAreas: ["01"],
        capabilities: ["el.installation"],
        certifications: [],
        registrations: ["f_tax"],
      });
      await addTask(pool, {
        orgRef,
        title: `Verkstadstavla ${companyName}`,
        owner: "Test Kontakt",
        createdBy: intake.provision.userId,
      });

      await persistSnapshot({
        pool,
        events,
        orgRef,
        tier: "enterprise",
        actorRef: intake.provision.userId,
        requestId: `fleet-tora-${n}-${stamp}`,
      });

      const rita = await requestAnalysis({
        pool,
        events,
        orgRef,
        actorRef: intake.provision.userId,
        companyName,
        orgNumber: i < 2 ? DEMO_ORG_NUMBER : orgNumber,
        requestId: `fleet-rita-${n}-${stamp}`,
        useDemoDocument: i < 2,
      });

      const jar = await login(email, password);
      const me = await request(jar, "/api/platform/me");
      const meOrg =
        me.json && typeof me.json === "object" && "user" in me.json
          ? (me.json as { user: { orgRef: string; orgName: string } }).user
          : null;
      report.checks.push(
        check(
          "login+me",
          me.status === 200 && meOrg?.orgRef === orgRef,
          meOrg?.orgName ?? me.text.slice(0, 80),
        ),
      );

      const invoices = await request(jar, "/api/ekonomi/invoices");
      const invoiceList =
        invoices.json && typeof invoices.json === "object" && "invoices" in invoices.json
          ? (
              invoices.json as {
                invoices: Array<{ id: string; customerName: string; number: string }>;
              }
            ).invoices
          : [];
      report.checks.push(
        check(
          "ekonomi-api",
          invoices.status === 200 &&
            invoiceList.some((row) => row.number === intake.invoice!.number) &&
            invoiceList.every((row) => row.customerName === companyName || row.id === booked.id),
          `${String(invoiceList.length)} fakturor`,
        ),
      );

      const tasks = await request(jar, "/api/kansli/tasks");
      const taskList =
        tasks.json && typeof tasks.json === "object" && "tasks" in tasks.json
          ? (tasks.json as { tasks: Array<{ title: string }> }).tasks
          : [];
      report.checks.push(
        check(
          "kansli-api",
          tasks.status === 200 &&
            taskList.some((row) => row.title === `Verkstadstavla ${companyName}`) &&
            !taskList.some((row) => row.title.startsWith("Förbered demo för")),
          `${String(taskList.length)} uppgifter`,
        ),
      );

      const cases = await request(jar, "/api/tyra/cases");
      report.checks.push(
        check(
          "tyra-api",
          cases.status === 200 && JSON.stringify(cases.json).includes(tyra.id),
          String(cases.status),
        ),
      );

      const irma = await request(jar, "/api/irma/agreements");
      report.checks.push(
        check(
          "irma-api",
          irma.status === 200 && JSON.stringify(irma.json).includes(agreement.id),
          String(irma.status),
        ),
      );

      const alva = await request(jar, "/api/alva/cases");
      report.checks.push(
        check(
          "alva-api",
          alva.status === 200 && JSON.stringify(alva.json).includes(companyName),
          String(alva.status),
        ),
      );

      const britt = await request(jar, "/api/britt/observations");
      report.checks.push(
        check(
          "britt-api",
          britt.status === 200 && JSON.stringify(britt.json).includes(companyName),
          String(britt.status),
        ),
      );

      const tora = await request(jar, "/api/tora/market");
      report.checks.push(
        check(
          "tora-api",
          tora.status === 200 && JSON.stringify(tora.json).includes(companyName),
          String(tora.status),
        ),
      );

      const ritaApi = await request(jar, "/api/rita/analyses");
      report.checks.push(
        check(
          "rita-api",
          ritaApi.status === 200 && JSON.stringify(ritaApi.json).includes(rita.id),
          rita.status,
        ),
      );

      const pages: Array<[string, string]> = [
        ["/kansli", `Verkstadstavla ${companyName}`],
        ["/ekonomi", companyName],
        [`/ekonomi/fakturor/${intake.invoice.id}`, intake.invoice.number],
        ["/tyra", `Kund ${n}`],
        [`/tyra/cases/${tyra.id}`, companyName],
        ["/irma", `Däckavtal ${companyName}`],
        ["/alva", `Oljud ${n}`],
        ["/britt", `Uppföljning ${companyName}`],
        ["/tora", companyName],
        ["/rita", companyName],
        ["/platform/events", companyName],
        [hub.path, `Kund ${n}`],
        [agreement.magicLink ?? "", `Däckavtal ${companyName}`],
      ];
      for (const [path, needle] of pages) {
        if (!path) continue;
        const page = await request(jar, path);
        const ok = page.status === 200 && page.text.includes(needle);
        report.checks.push(
          check(
            `ui:${path}`,
            ok,
            ok ? "visar rätt bolag" : `status ${String(page.status)} saknar ${needle}`,
          ),
        );
      }

      const inbox = await request(jar, "/kansli/upphandling");
      const listed = inbox.text.includes(`Test Kontakt · ${email}`);
      const inboxOk = inbox.status === 200 && inbox.text.includes("kansliets inkorg") && !listed;
      report.checks.push(
        check(
          "house-inbox",
          inboxOk,
          inboxOk
            ? "verkstad ser inte huslistan"
            : `status ${String(inbox.status)} listed=${String(listed)}`,
        ),
      );
      const stolenIntake = await request(jar, `/kansli/upphandling/${intake.intake.id}`);
      report.checks.push(
        check(
          "house-inbox-id",
          stolenIntake.status === 404,
          `status ${String(stolenIntake.status)}`,
        ),
      );

      if (i > 0 && reports[0]?.orgRef) {
        const stolenId = (
          await pool.query<{ id: string }>(
            `select id from ekonomi.invoices where org_ref = $1 order by created_at desc limit 1`,
            [reports[0].orgRef],
          )
        ).rows[0]?.id;
        if (stolenId) {
          const stolen = await request(jar, `/api/ekonomi/invoices/${stolenId}`);
          report.checks.push(
            check("isolation-api", stolen.status === 404, `status ${String(stolen.status)}`),
          );
          const stolenPage = await request(jar, `/ekonomi/fakturor/${stolenId}`);
          report.checks.push(
            check(
              "isolation-ui",
              stolenPage.status === 404 &&
                !stolenPage.text.includes(reports[0]?.invoiceNumber ?? stolenId),
              `status ${String(stolenPage.status)}`,
            ),
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      report.checks.push(check("provision", false, message));
      failures.push(`${companyName}: ${message}`);
    }
    const failed = report.checks.filter((c) => !c.ok);
    if (failed.length) failures.push(`${companyName}: ${failed.map((c) => c.name).join(", ")}`);
    reports.push(report);
    console.log(
      `${n} ${companyName} ${report.checks.filter((c) => c.ok).length}/${report.checks.length} ok`,
    );
  }

  await pool.end();
  const summary = {
    base: BASE,
    stamp,
    limit: LIMIT,
    companies: reports.length,
    passed: reports.filter((r) => r.checks.every((c) => c.ok)).length,
    failedCompanies: reports.filter((r) => r.checks.some((c) => !c.ok)).map((r) => r.companyName),
    failures,
    reports: reports.map((r) => ({
      ...r,
      email: r.email,
    })),
  };
  await mkdir("/opt/cursor/artifacts", { recursive: true });
  await writeFile("/opt/cursor/artifacts/live-fleet-report.json", JSON.stringify(summary, null, 2));
  console.log(`klar: ${String(summary.passed)}/${String(summary.companies)} bolag helt gröna`);
  return { passed: summary.passed, companies: summary.companies, failures };
}

const live = process.env.LIVE_FLEET === "1" && APP && OWNER ? describe : describe.skip;

live("live fleet: 20 workshops through API and UI", () => {
  it("provisions each workshop and shows only that workshop's data", async () => {
    const result = await runFleet();
    expect(result.failures, result.failures.join("\n")).toEqual([]);
    expect(result.passed).toBe(LIMIT);
  }, 1_200_000);
});
