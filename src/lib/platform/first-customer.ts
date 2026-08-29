import type pg from "pg";
import { isHardenedRuntime } from "../auth/secrets.ts";
import { DEFAULT_LOCALE, t, type Locale } from "../i18n/index.ts";
import { listAgreements } from "../irma/agreements.ts";
import { ritaEngineSnapshot } from "../rita/resolve-engine.ts";
import { getCompanyProfile } from "../tora/profile.ts";
import { listCases } from "../tyra/cases.ts";
import { creditConfigured } from "./credit.ts";
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
  creditVendor?: boolean;
  hardened?: boolean;
  locale?: Locale;
}): FirstCustomerBoard {
  const locale = input.locale ?? DEFAULT_LOCALE;
  const hardened = input.hardened ?? (input.appEnv === "prod" || input.appEnv === "production");
  const gates: FirstCustomerGate[] = [
    {
      id: "database",
      title: t(locale, "ready.gate.database.title"),
      state: input.databaseUp ? "ready" : "blocked",
      detail: input.databaseUp
        ? t(locale, "ready.gate.database.up")
        : t(locale, "ready.gate.database.down"),
    },
    {
      id: "secrets",
      title: t(locale, "ready.gate.secrets.title"),
      state: !hardened ? "open" : input.sessionSecretSet ? "ready" : "blocked",
      detail: !hardened
        ? t(locale, "ready.gate.secrets.open", { env: input.appEnv || "dev" })
        : input.sessionSecretSet
          ? t(locale, "ready.gate.secrets.ready")
          : t(locale, "ready.gate.secrets.blocked"),
    },
    {
      id: "demo",
      title: t(locale, "ready.gate.demo.title"),
      state: input.seedDemo ? (hardened ? "blocked" : "open") : "ready",
      detail: input.seedDemo
        ? hardened
          ? t(locale, "ready.gate.demo.blocked")
          : t(locale, "ready.gate.demo.open")
        : t(locale, "ready.gate.demo.ready"),
    },
    {
      id: "cron",
      title: t(locale, "ready.gate.cron.title"),
      state: input.cronSecretSet ? "ready" : "open",
      detail: input.cronSecretSet
        ? t(locale, "ready.gate.cron.ready")
        : t(locale, "ready.gate.cron.open"),
    },
    {
      id: "tyra",
      title: t(locale, "ready.gate.tyra.title"),
      state:
        input.tyraCases > 0 && input.tyraInspections > 0 && input.tyraQuotes > 0
          ? "ready"
          : input.tyraCases > 0
            ? "open"
            : "open",
      detail:
        input.tyraCases === 0
          ? t(locale, "ready.gate.tyra.empty")
          : t(locale, "ready.gate.tyra.count", {
              cases: input.tyraCases,
              inspections: input.tyraInspections,
              quotes: input.tyraQuotes,
            }),
    },
    {
      id: "irma",
      title: t(locale, "ready.gate.irma.title"),
      state: input.irmaAgreements > 0 ? "ready" : "open",
      detail:
        input.irmaAgreements > 0
          ? t(locale, "ready.gate.irma.some", { count: input.irmaAgreements })
          : t(locale, "ready.gate.irma.none"),
    },
    {
      id: "tora",
      title: t(locale, "ready.gate.tora.title"),
      state: input.toraProfileSaved ? "ready" : "open",
      detail: input.toraProfileSaved
        ? t(locale, "ready.gate.tora.ready")
        : t(locale, "ready.gate.tora.open"),
    },
    {
      id: "rita",
      title: t(locale, "ready.gate.rita.title"),
      state: input.ritaAvailable ? "ready" : "blocked",
      detail: input.ritaAvailable
        ? t(locale, "ready.gate.rita.ready")
        : t(locale, "ready.gate.rita.blocked"),
    },
    {
      id: "alva",
      title: t(locale, "ready.gate.alva.title"),
      state: "blocked",
      detail: t(locale, "ready.gate.alva.detail"),
    },
    {
      id: "creditae",
      title: t(locale, "ready.gate.creditae.title"),
      state: "open",
      detail: input.creditVendor
        ? t(locale, "ready.gate.creditae.on")
        : t(locale, "ready.gate.creditae.off"),
    },
    {
      id: "ekonomi",
      title: t(locale, "ready.gate.ekonomi.title"),
      state: input.ekonomiIssued > 0 ? "ready" : "open",
      detail:
        input.ekonomiIssued === 0
          ? t(locale, "ready.gate.ekonomi.empty")
          : t(locale, "ready.gate.ekonomi.count", {
              issued: input.ekonomiIssued,
              paid: input.ekonomiPaid,
            }),
    },
    {
      id: "sms",
      title: t(locale, "ready.gate.sms.title"),
      state: input.smsVendor && input.smsEnabled ? "ready" : "open",
      detail: input.smsVendor
        ? input.smsEnabled
          ? t(locale, "ready.gate.sms.ready")
          : t(locale, "ready.gate.sms.vendor")
        : t(locale, "ready.gate.sms.off"),
    },
    {
      id: "upphandling",
      title: t(locale, "ready.gate.upphandling.title"),
      state: "ready",
      detail: t(locale, "ready.gate.upphandling.detail"),
    },
    {
      id: "honesty",
      title: t(locale, "ready.gate.honesty.title"),
      state: "open",
      detail: t(locale, "ready.gate.honesty.detail"),
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
  locale: Locale = DEFAULT_LOCALE,
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
    creditVendor: creditConfigured(),
    locale,
  });
}
