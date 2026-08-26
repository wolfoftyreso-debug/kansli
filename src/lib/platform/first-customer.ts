import type pg from "pg";
import { isHardenedRuntime } from "../auth/secrets.ts";
import { listAgreements } from "../irma/agreements.ts";
import { ritaEngineSnapshot } from "../rita/resolve-engine.ts";
import { getCompanyProfile } from "../tora/profile.ts";
import { listCases } from "../tyra/cases.ts";
import { smsConfigured } from "./sms.ts";
import { hubStatus } from "./hub-status.ts";

export type GateState = "ready" | "open" | "blocked";

export type FirstCustomerGate = {
  id: string;
  title: string;
  state: GateState;
  detail: string;
};

export type FirstCustomerBoard = {
  /** Pilot (identity + IRMA + TYRA + TORA demo + BRITT) can be offered. */
  pilotOfferable: boolean;
  /** All six products as sold truth. Always false until named engines exist. */
  allSystemsReady: boolean;
  gates: FirstCustomerGate[];
};

export function evaluateFirstCustomerGates(input: {
  databaseUp: boolean;
  appEnv: string;
  seedDemo: boolean;
  sessionSecretSet: boolean;
  cronSecretSet: boolean;
  toraProfileSaved: boolean;
  tyraCases: number;
  tyraInspections: number;
  tyraQuotes: number;
  irmaAgreements: number;
  ritaAvailable: boolean;
  ekonomiIssued: number;
  ekonomiPaid: number;
  smsVendor: boolean;
  smsEnabled: boolean;
  hardened?: boolean;
}): FirstCustomerBoard {
  const hardened = input.hardened ?? (input.appEnv === "prod" || input.appEnv === "production");
  const gates: FirstCustomerGate[] = [
    {
      id: "database",
      title: "Postgres svarar",
      state: input.databaseUp ? "ready" : "blocked",
      detail: input.databaseUp
        ? "Databasen svarar."
        : "Databasen svarar inte (DATABASE_URL saknas).",
    },
    {
      id: "secrets",
      title: "Hemligheter i drift",
      state: !hardened ? "open" : input.sessionSecretSet ? "ready" : "blocked",
      detail: !hardened
        ? `APP_ENV=${input.appEnv || "dev"} — fail-closed gäller först i prod.`
        : input.sessionSecretSet
          ? "APP_SESSION_SECRET är satt."
          : "APP_SESSION_SECRET saknas. Processen ska inte starta.",
    },
    {
      id: "demo",
      title: "Inte ett öppet demoläge mot kund",
      state: input.seedDemo ? (hardened ? "blocked" : "open") : "ready",
      detail: input.seedDemo
        ? hardened
          ? "PIXDRIFT_SEED_DEMO=true i produktion. Processen ska inte starta."
          : "PIXDRIFT_SEED_DEMO=true. Stäng av innan första kunden loggar in."
        : "Exempelläget är av.",
    },
    {
      id: "cron",
      title: "Cron-hemlighet (TYRA-påminnelser)",
      state: input.cronSecretSet ? "ready" : "open",
      detail: input.cronSecretSet
        ? "CRON_SECRET är satt. Påminnelser läggs ändå i kö och skickas inte än."
        : "CRON_SECRET saknas. Påminnelser kan inte köras automatiskt.",
    },
    {
      id: "tyra",
      title: "TYRA-verkstad har kört slingan",
      state:
        input.tyraCases > 0 && input.tyraInspections > 0 && input.tyraQuotes > 0
          ? "ready"
          : input.tyraCases > 0
            ? "open"
            : "open",
      detail:
        input.tyraCases === 0
          ? "Inget ärende ännu. Öppna ett, mät mönsterdjup, skriv offertutkast, sätt lagerplats."
          : `${input.tyraCases} ärende, ${input.tyraInspections} inspektion, ${input.tyraQuotes} offertutkast.`,
    },
    {
      id: "irma",
      title: "IRMA har använts",
      state: input.irmaAgreements > 0 ? "ready" : "open",
      detail:
        input.irmaAgreements > 0
          ? `${input.irmaAgreements} underlag. Enkel bekräftelse, inte e-signatur.`
          : "Inget underlag skapat. Enkel bekräftelse, inte e-signatur.",
    },
    {
      id: "tora",
      title: "TORA kör er profil, inte Exempelbolaget",
      state: input.toraProfileSaved ? "ready" : "open",
      detail: input.toraProfileSaved
        ? "Bolagsprofil sparad. Marknaden är fortfarande demo."
        : "Spara bolagsprofilen. Annars räknar vi på exempelbolaget.",
    },
    {
      id: "rita",
      title: "RITA:s analys",
      state: input.ritaAvailable ? "ready" : "blocked",
      detail: input.ritaAvailable
        ? "Analysen är inkopplad. Analysera bara riktiga underlag."
        : "Analysen är inte inkopplad. Sälj inte RITA.",
    },
    {
      id: "alva",
      title: "ALVA-diagnos",
      state: "blocked",
      detail: "Diagnosen byggs separat. Här registrerar ni bara ärenden.",
    },
    {
      id: "creditae",
      title: "CREDITAE är bedömning, inte byrå",
      state: "open",
      detail:
        "Ni kan registrera motpart och er slutsats. Ingen kreditupplysningsbyrå är inkopplad. Sälj inte ett kreditbetyg.",
    },
    {
      id: "ekonomi",
      title: "Ekonomi är en bok, inte Visma",
      state: input.ekonomiIssued > 0 ? "ready" : "open",
      detail:
        input.ekonomiIssued === 0
          ? "Ingen utfärdad faktura ännu. Boken tar 10-dagarsfaktura och verifikat. Visma och Fortnox är inte inkopplade."
          : `${input.ekonomiIssued} utfärdade, ${input.ekonomiPaid} betalda. Visma är inte anslutet. Stripe och Swish bara med nyckel.`,
    },
    {
      id: "sms",
      title: "SMS vid sälj är valt, inte påtvingat",
      state: input.smsVendor && input.smsEnabled ? "ready" : "open",
      detail: input.smsVendor
        ? input.smsEnabled
          ? "Telefonen är kopplad och ni har sagt ja. Ett missat SMS rullar inte tillbaka en bokad sälj."
          : "Telefonen är kopplad. SMS är avstängt tills ni säger ja."
        : "Numret kan sparas. SMS går inte ut förrän telefonen är kopplad i drift.",
    },
    {
      id: "upphandling",
      title: "Koncernupphandling är ett formulär",
      state: "ready",
      detail:
        "Formuläret på Upphandling samlar in system, miljö och kontakt, skapar konto och utfärdar faktura med tio dagars betalning. Mötet läggs klockan 10.00 tio dagar senare.",
    },
    {
      id: "honesty",
      title: "Kunden skriver under vad produkten inte är",
      state: "open",
      detail:
        "Ingen kvalificerad e-signatur, inga live-däckpriser, ingen Visma eller Fortnox, ingen ALVA-diagnos, inget kreditbetyg från CREDITAE. SMS vid sälj bara när telefonen är kopplad och ni sagt ja. TYRA-påminnelser skickas inte. Stripe och Revolut bara när de är inkopplade.",
    },
  ];

  const blockingPilot = gates.filter(
    (gate) =>
      (gate.id === "database" || gate.id === "secrets" || gate.id === "demo") &&
      gate.state === "blocked",
  );
  const pilotOfferable = blockingPilot.length === 0;
  return {
    pilotOfferable,
    allSystemsReady: false,
    gates,
  };
}

export async function loadFirstCustomerBoard(
  pool: pg.Pool | null,
  orgRef: string | null,
): Promise<FirstCustomerBoard> {
  const status = hubStatus();
  const rita = ritaEngineSnapshot();
  let toraProfileSaved = false;
  let tyraCases = 0;
  let tyraInspections = 0;
  let tyraQuotes = 0;
  let irmaAgreements = 0;
  let ekonomiIssued = 0;
  let ekonomiPaid = 0;
  let smsEnabled = false;

  if (pool && orgRef) {
    const [profile, cases, inspections, quotes, agreements, issued, paid, sms] = await Promise.all([
      getCompanyProfile(pool, orgRef),
      listCases(pool, orgRef),
      pool.query<{ n: string }>(
        `select count(*)::text as n from tyra.tire_inspections where org_ref = $1`,
        [orgRef],
      ),
      pool.query<{ n: string }>(
        `select count(*)::text as n from tyra.quote_drafts where org_ref = $1`,
        [orgRef],
      ),
      listAgreements(pool, orgRef),
      pool.query<{ n: string }>(
        `select count(*)::text as n from ekonomi.invoices
          where org_ref = $1 and status in ('issued','part_paid','paid')`,
        [orgRef],
      ),
      pool.query<{ n: string }>(
        `select count(*)::text as n from ekonomi.invoices where org_ref = $1 and status = 'paid'`,
        [orgRef],
      ),
      pool.query<{ enabled: boolean }>(
        `select enabled from ekonomi.sales_alert_settings where org_ref = $1`,
        [orgRef],
      ),
    ]);
    toraProfileSaved = Boolean(profile);
    tyraCases = cases.length;
    tyraInspections = Number(inspections.rows[0]?.n ?? 0);
    tyraQuotes = Number(quotes.rows[0]?.n ?? 0);
    irmaAgreements = agreements.length;
    ekonomiIssued = Number(issued.rows[0]?.n ?? 0);
    ekonomiPaid = Number(paid.rows[0]?.n ?? 0);
    smsEnabled = Boolean(sms.rows[0]?.enabled);
  }

  const session = process.env.APP_SESSION_SECRET?.trim() ?? "";
  return evaluateFirstCustomerGates({
    databaseUp: status.database === "up",
    appEnv: process.env.APP_ENV ?? "",
    hardened: isHardenedRuntime(),
    seedDemo: process.env.PIXDRIFT_SEED_DEMO === "true",
    sessionSecretSet:
      (session.length >= 32 && !session.startsWith("kansli-dev")) || !isHardenedRuntime(),
    cronSecretSet: Boolean(process.env.CRON_SECRET?.trim()),
    toraProfileSaved,
    tyraCases,
    tyraInspections,
    tyraQuotes,
    irmaAgreements,
    ritaAvailable: rita.available,
    ekonomiIssued,
    ekonomiPaid,
    smsVendor: smsConfigured(),
    smsEnabled,
  });
}
