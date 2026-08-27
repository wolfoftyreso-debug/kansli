import type { SystemId, SystemStatus } from "@pixdrift/systems";

/**
 * What each system does *in this repo today*, and how they connect.
 * Marketing copy lives elsewhere. This is the operating map.
 * Machine fields (id, schema, paths, events) live in `@pixdrift/systems`.
 * English is the source. UI translations live in `@/lib/i18n`.
 */
export interface FamilySystem {
  id: SystemId;
  name: string;
  /** Why the product exists. Not the same as the slice in this nav. */
  mission: string;
  question: string;
  does: string;
  doesNot: string;
  owns: readonly string[];
  status: SystemStatus;
}

export interface FamilyLink {
  id: string;
  from: string;
  to: string;
  via: string;
  meaning: string;
}

export interface FamilyStackRow {
  id: string;
  layer: string;
  runs: string;
}

export const FAMILY_STATUS_LABEL: Record<SystemStatus, string> = {
  operational: "Running",
  pilot: "On the way",
  deferred: "Not ready yet",
};

export const FAMILY_PRINCIPLE =
  "The same sign-in in every system. Each system does its own job. TORA takes procurement. RITA takes tax. They are not mixed.";

/** What this nav repo actually runs. Not the target architecture. */
export const FAMILY_STACK: readonly FamilyStackRow[] = [
  {
    id: "language",
    layer: "Language",
    runs: "TypeScript 5 across the system. SQL in the database. RITA's analysis runs as its own program. ekonomi-ledger checks vouchers, it does not post in production.",
  },
  {
    id: "web",
    layer: "Web",
    runs: "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. One process: site, /idp, products and API.",
  },
  {
    id: "identity",
    layer: "Identity",
    runs: "Own sign-in, built on an open standard. One cookie keeps you signed in. The same sign-in in every system.",
  },
  {
    id: "data",
    layer: "Data",
    runs: "PostgreSQL 16. Each system has its own data. No system writes another system's records.",
  },
  {
    id: "analysis",
    layer: "Analysis",
    runs: "TORA calculates in the same process. RITA calls its own analysis. No invented results in production.",
  },
  {
    id: "automation",
    layer: "Automation",
    runs: "Models go through the Vercel gateway. The answer is a guess, not a fact.",
  },
  {
    id: "ops",
    layer: "Operations and test",
    runs: "Runs on Vercel. Tests against Postgres 16. No AWS SDK in this system.",
  },
];

export const FAMILY_SYSTEMS: readonly FamilySystem[] = [
  {
    id: "identity",
    name: "PIXDRIFT Identity",
    mission: "One sign-in for every system.",
    question: "Who are you, and which company does it apply to?",
    does: "You sign in once. Then you are in Kansli, TORA, RITA and the others.",
    doesNot: "No invoices are sent here, and there is no extra mobile code yet.",
    owns: ["public (users, orgs, clients, keys)"],
    status: "operational",
  },
  {
    id: "kansli",
    name: "Kansli",
    mission: "The start page. Tasks and the way in.",
    question: "Where do I start, and what should we do internally?",
    does: "Sign-in, an internal task board and the form for new customers.",
    doesNot: "Kansli does not calculate procurement, tax or tyres. The other systems do that.",
    owns: ["kansli.tasks", "kansli.intakes"],
    status: "operational",
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    mission: "Invoices, VAT and how the money came in.",
    question: "What is booked, what is overdue, and how did the money come in?",
    does: "Writes a 10-day invoice, books in öre, connects Stripe and Revolut, matches incoming payments when the bank is connected.",
    doesNot:
      "Not Visma. Not Fortnox. No invented payment. Cards need Stripe. Swish needs Swish to be wired.",
    owns: [
      "ekonomi.accounts",
      "ekonomi.transactions",
      "ekonomi.entries",
      "ekonomi.invoices",
      "ekonomi.payments",
      "ekonomi.connectors",
      "ekonomi.sales_alert_settings",
      "ekonomi.sales_alert_outbox",
    ],
    status: "pilot",
  },
  {
    id: "tora",
    name: "TORA",
    mission: "Which procurements your company can take.",
    question: "Can we bid here — and what should we do now?",
    does: "Compares the company with the procurements: requirements, gaps, amounts, dates and the next step.",
    doesNot: "Does not look in the books. RITA does that.",
    owns: ["tora.market_snapshots"],
    status: "pilot",
  },
  {
    id: "rita",
    name: "RITA",
    mission: "Looks for tax savings in your books.",
    question: "Which deductions, VAT and other gaps sit in the annual accounts?",
    does: "Reads the annual accounts against Swedish tax rules and leaves proposals to check. Not tax advice.",
    doesNot:
      "Does not invent results. Does not say whether you may bid. No customer file to upload yet.",
    owns: ["rita.analyses"],
    status: "pilot",
  },
  {
    id: "britt",
    name: "BRITT",
    mission: "What happened and needs follow-up.",
    question: "What do you need to do now, based on what already happened?",
    does: "Collects things that must be followed up. One thing at a time, with the next step.",
    doesNot: "BRITT is not a case system and not a chat.",
    owns: ["britt.observations", "britt.findings", "britt.metric_snapshots", "britt.analysis_runs"],
    status: "pilot",
  },
  {
    id: "irma",
    name: "IRMA",
    mission: "Send an agreement, see if it is read and confirmed.",
    question: "Has the counterpart read and confirmed the agreement?",
    does: "Sends the agreement. Shows whether it is opened, signed or rejected.",
    doesNot: "IRMA is not email and not an archive for every document.",
    owns: ["irma.agreements"],
    status: "pilot",
  },
  {
    id: "tyra",
    name: "TYRA",
    mission: "Customer, car, wheels and what to do next.",
    question: "Which customer, which car, which wheels — and what is the next step?",
    does: "Keeps customer, vehicle and tyres together. Shows when it is time to change or collect.",
    doesNot: "TYRA is not a general customer register for other trades.",
    owns: [
      "tyra.customers",
      "tyra.vehicles",
      "tyra.tire_cases",
      "tyra.customer_hub_links",
      "tyra.reminder_outbox",
      "tyra.tenant_supplier_accounts",
    ],
    status: "pilot",
  },
  {
    id: "alva",
    name: "ALVA",
    mission: "The customer's fault, notes and measurements. Diagnosis comes later.",
    question: "What did the customer say, what was measured — and what is the next step?",
    does: "Takes what was said and measured. Shows the note. Does not diagnose on its own.",
    doesNot: "ALVA does not diagnose and does not give advice.",
    owns: ["alva.cases", "alva.case_observations", "alva.case_measurements"],
    status: "deferred",
  },
  {
    id: "creditae",
    name: "CREDITAE",
    mission: "Credit assessment of a counterpart. Your conclusion, no invented score.",
    question: "Who should we assess — and what did you conclude?",
    does: "Takes an organisation number and your assessment. Fetches the bureau report through the platform credit channel when it is wired. Go, watch or stop.",
    doesNot: "CREDITAE sets no credit score. The product does not call Creditsafe.",
    owns: ["creditae.inquiries"],
    status: "pilot",
  },
  {
    id: "maj",
    name: "MAJ",
    mission: "Measure, analyse, adjust. Search visibility as decisions, not dashboards.",
    question: "What changed in search — and what should we do about it?",
    does: "Takes a domain, a market and a goal. Watches search data through platform channels, weighs the evidence, and proposes a short queue of decisions with a full provenance trail. Every completed change is published as a versioned release.",
    doesNot: "MAJ never buys links, fakes reviews or touches a competitor's assets. It shows decisions, not vendor metrics — the customer never needs to understand the data sources.",
    owns: [
      "maj.projects",
      "maj.signals",
      "maj.actions",
      "maj.releases",
      "maj.usage_ledger",
      "maj.strategy_proposals",
    ],
    status: "pilot",
  },
];

export const FAMILY_LINKS: readonly FamilyLink[] = [
  {
    id: "identity.products",
    from: "identity",
    to: "products",
    via: "OIDC → kansli_session",
    meaning: "One sign-in. Products do not read each other's user lists.",
  },
  {
    id: "identity.events",
    from: "identity",
    to: "platform.events",
    via: "identity.session.started",
    meaning:
      "A successful sign-in is written in the log. It is a receipt, not a task to follow up.",
  },
  {
    id: "tora.britt",
    from: "tora",
    to: "britt",
    via: "tora.market.evaluated",
    meaning: "Only when someone publishes. Reading the market creates no event.",
  },
  {
    id: "rita.britt",
    from: "rita",
    to: "britt",
    via: "rita.analysis.completed | rita.analysis.blocked",
    meaning:
      "BRITT gets the company name, how many hits it produced and whether automation was involved. Not the proposals themselves — those stay in RITA.",
  },
  {
    id: "irma.britt",
    from: "irma",
    to: "britt",
    via: "irma.agreement.created | irma.agreement.viewed | irma.agreement.signed | irma.agreement.cancelled",
    meaning: "Agreement created, opened, confirmed or withdrawn.",
  },
  {
    id: "tyra.britt",
    from: "tyra",
    to: "britt",
    via: "tyra.case.created | tyra.case.completed | tyra.hub.link.issued | tyra.reminder.enqueued | tyra.reminder.blocked",
    meaning:
      "A case, a customer link or a reminder in the queue. A blocked queue does not mean sent.",
  },
  {
    id: "alva.britt",
    from: "alva",
    to: "britt",
    via: "alva.case.created",
    meaning: "A case is registered. No diagnosis follows until it is wired.",
  },
  {
    id: "creditae.britt",
    from: "creditae",
    to: "britt",
    via: "creditae.inquiry.created | creditae.assessment.recorded | creditae.report.fetched | creditae.report.failed",
    meaning:
      "A counterpart is registered, you have written your conclusion, or the bureau report arrived or stopped. No invented score follows.",
  },
  {
    id: "ekonomi.britt",
    from: "ekonomi",
    to: "britt",
    via: "ekonomi.invoice.issued | ekonomi.payment.recorded | ekonomi.revolut.sync.blocked",
    meaning:
      "An issued invoice, a booked incoming payment or a Revolut fetch that did not go through.",
  },
  {
    id: "ekonomi.revolut",
    from: "ekonomi",
    to: "platform.events",
    via: "ekonomi.revolut.oauth.started | ekonomi.revolut.oauth.completed | ekonomi.revolut.oauth.failed | ekonomi.revolut.connection.action_required | ekonomi.revolut.connection.disconnected | ekonomi.revolut.certificate.expiry_warning",
    meaning:
      "The bank connection lifecycle. Ordinary renewal is logged as operations, not as something to follow up.",
  },
  {
    id: "ekonomi.invoice",
    from: "ekonomi",
    to: "platform.events",
    via: "ekonomi.invoice.created",
    meaning: "A draft appears in the log. No bookkeeping until issue.",
  },
  {
    id: "kansli.task",
    from: "kansli",
    to: "britt",
    via: "kansli.task.created",
    meaning: "An internal task appears in BRITT. Kansli still owns the task.",
  },
  {
    id: "kansli.intake",
    from: "kansli",
    to: "britt",
    via: "kansli.intake.received | kansli.account.provisioned",
    meaning: "An application has come in, or a workshop account was created for the demo.",
  },
  {
    id: "britt.finding",
    from: "britt",
    to: "britt",
    via: "britt.finding.recorded",
    meaning:
      "The most important hits from the sample analysis become things to follow up. The rest stays in BRITT.",
  },
  {
    id: "britt.events",
    from: "britt",
    to: "platform.events",
    via: "britt.observation.recorded",
    meaning: "Each thing to follow up is also written in the event list.",
  },
];

export function familyPartyName(id: string): string {
  if (id === "products" || id === "alla produkter") return "every product";
  if (id === "platform.events") return "the event list";
  return FAMILY_SYSTEMS.find((system) => system.id === id)?.name ?? id;
}

/** Products taken in when they have their own data, page and events. */
export const FAMILY_INCOMING =
  "More systems are on the way. They get the same sign-in and their own records. Names come when they are ready — not before.";

export const FAMILY_BLOCKED = [
  {
    id: "rita",
    need: "RITA's analysis must be wired (on Vercel via URL, locally via the program file) before analyses can run.",
  },
  {
    id: "alva",
    need: "The guided diagnosis is wired when it is ready. The case can be registered already.",
  },
  {
    id: "irma",
    need: "IRMA stays with us: a simple digital confirmation and its own link. No legal e-signature yet.",
  },
  {
    id: "britt",
    need: "Fortnox, Revolut and BRITT's profiles if the sample analysis is to become the whole product.",
  },
  {
    id: "ekonomi",
    need: "Stripe, Revolut and Swish when you want to take payment that way. A 10-day invoice works without them.",
  },
  {
    id: "creditae",
    need: "CREDITAE goes through the platform credit channel. Products do not call Creditsafe. Without a key no report is fetched. The assessment is still yours.",
  },
  {
    id: "maj",
    need: "MAJ reads search data through platform channels. Sources without credentials fail closed and become connect-source decisions — the system never invents numbers.",
  },
] as const;
