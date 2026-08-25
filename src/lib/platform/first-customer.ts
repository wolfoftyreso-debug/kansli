import type pg from "pg";
import { isHardenedRuntime } from "../auth/secrets.ts";
import { listAgreements } from "../irma/agreements.ts";
import { ritaEngineSnapshot } from "../rita/resolve-engine.ts";
import { getCompanyProfile } from "../tora/profile.ts";
import { listCases } from "../tyra/cases.ts";
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
}): FirstCustomerBoard {
  const hardened = input.appEnv === "prod" || input.appEnv === "production";
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
      state: input.seedDemo ? "open" : "ready",
      detail: input.seedDemo
        ? "PIXDRIFT_SEED_DEMO=true. Stäng av innan första kunden loggar in."
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
          ? `${input.irmaAgreements} underlag. Fortfarande inte BankID.`
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
        "Ingen BankID-signering, inga live-däckpriser, inga SMS-utskick, ingen koppling till upphandlingsdatabaser eller Fortnox. Stripe och Revolut bara när de är inkopplade. Detta kryssar kunden i på formuläret.",
    },
  ];

  const blockingPilot = gates.filter(
    (gate) => (gate.id === "database" || gate.id === "secrets") && gate.state === "blocked",
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

  if (pool && orgRef) {
    const [profile, cases, inspections, quotes, agreements] = await Promise.all([
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
    ]);
    toraProfileSaved = Boolean(profile);
    tyraCases = cases.length;
    tyraInspections = Number(inspections.rows[0]?.n ?? 0);
    tyraQuotes = Number(quotes.rows[0]?.n ?? 0);
    irmaAgreements = agreements.length;
  }

  return evaluateFirstCustomerGates({
    databaseUp: status.database === "up",
    appEnv: process.env.APP_ENV ?? "",
    seedDemo: process.env.PIXDRIFT_SEED_DEMO === "true",
    sessionSecretSet: Boolean(process.env.APP_SESSION_SECRET?.trim()) || !isHardenedRuntime(),
    cronSecretSet: Boolean(process.env.CRON_SECRET?.trim()),
    toraProfileSaved,
    tyraCases,
    tyraInspections,
    tyraQuotes,
    irmaAgreements,
    ritaAvailable: rita.available,
  });
}
