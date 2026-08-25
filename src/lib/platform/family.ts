import type { SystemId, SystemStatus } from "@pixdrift/systems";

/**
 * What each system does *in this repo today*, and how they connect.
 * Marketing copy lives elsewhere. This is the operating map.
 * Machine fields (id, schema, paths, events) live in `@pixdrift/systems`.
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
  from: string;
  to: string;
  via: string;
  meaning: string;
}

export const FAMILY_STATUS_LABEL: Record<SystemStatus, string> = {
  operational: "Igång",
  pilot: "På väg",
  deferred: "Inte klart än",
};

export const FAMILY_PRINCIPLE =
  "Samma inloggning i alla system. Varje system sköter sitt. TORA tar upphandlingar. RITA tar skatt. De blandas inte.";

/** What this nav repo actually runs. Not the target architecture. */
export const FAMILY_STACK: readonly { layer: string; runs: string }[] = [
  {
    layer: "Språk",
    runs: "TypeScript 5 i hela systemet. SQL i databasen. RITA:s analys körs som ett eget program. ekonomi-ledger kontrollerar verifikat, postar inte i drift.",
  },
  {
    layer: "Webb",
    runs: "Next.js 16.3 App Router, React 19.2, Tailwind CSS 4. En process: sajt, /idp, produkter och API.",
  },
  {
    layer: "Identitet",
    runs: "Egen inloggning, byggd på öppen standard. En cookie håller er inloggade. Samma inloggning i alla system.",
  },
  {
    layer: "Data",
    runs: "PostgreSQL 16. Varje system har sin egen data. Inget system skriver i ett annat systems uppgifter.",
  },
  {
    layer: "Analys",
    runs: "TORA räknar i samma process. RITA anropar en egen analys. Inga påhittade resultat i drift.",
  },
  {
    layer: "AI",
    runs: "AI går via Vercel AI Gateway. Svaret är en gissning, inte fakta.",
  },
  {
    layer: "Drift och test",
    runs: "Körs på Vercel. Tester mot Postgres 16. Ingen AWS SDK i det här systemet.",
  },
];

export const FAMILY_SYSTEMS: readonly FamilySystem[] = [
  {
    id: "identity",
    name: "PIXDRIFT Identity",
    mission: "En inloggning till alla system.",
    question: "Vem är du, och vilket bolag gäller det?",
    does: "Du loggar in en gång. Sedan är du inne i Kansli, TORA, RITA och de andra.",
    doesNot: "Här skickas inga fakturor och här finns ingen extra kod i mobilen än.",
    owns: ["public (users, orgs, clients, keys)"],
    status: "operational",
  },
  {
    id: "kansli",
    name: "Kansli",
    mission: "Startsidan. Uppgifter och vägen in.",
    question: "Var börjar jag, och vad ska vi göra internt?",
    does: "Inloggning, intern uppgiftstavla och formuläret för nya kunder.",
    doesNot: "Kansli räknar inte på upphandling, skatt eller däck. Det gör de andra systemen.",
    owns: ["kansli.tasks", "kansli.intakes"],
    status: "operational",
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    mission: "Fakturor, moms och hur pengarna kom in.",
    question: "Vad är bokat, vad är förfallet, och hur kom pengarna in?",
    does: "Skriver faktura på 10 dagar, bokför i öre, kopplar Stripe och Revolut, matchar inbetalningar när banken är ansluten.",
    doesNot:
      "Inte Fortnox. Ingen påhittad inbetalning. Kort kräver Stripe. Swish kräver att Swish är inkopplat.",
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
    mission: "Vilka upphandlingar just ert bolag kan ta.",
    question: "Kan vi lämna anbud här — och vad ska vi göra nu?",
    does: "Jämför bolaget mot upphandlingarna: krav, luckor, belopp, datum och nästa steg.",
    doesNot: "Tittar inte i räkenskaperna. Det gör RITA.",
    owns: ["tora.market_snapshots"],
    status: "pilot",
  },
  {
    id: "rita",
    name: "RITA",
    mission: "Letar skattebesparingar i era böcker.",
    question: "Vilka avdrag, moms och andra luckor sitter i bokslutet?",
    does: "Läser bokslutet mot svenska skatteregler och lämnar förslag att kolla. Inte skatteråd.",
    doesNot:
      "Hittar inte på resultat. Säger inte om ni får lämna anbud. Ingen kundfil att ladda upp än.",
    owns: ["rita.analyses"],
    status: "pilot",
  },
  {
    id: "britt",
    name: "BRITT",
    mission: "Det som hänt och behöver följas upp.",
    question: "Vad behöver ni göra nu, utifrån det som redan hänt?",
    does: "Samlar saker som måste följas upp. En sak i taget, med nästa steg.",
    doesNot: "BRITT är inte ett ärendesystem och inte en chatt.",
    owns: ["britt.observations", "britt.findings", "britt.metric_snapshots", "britt.analysis_runs"],
    status: "pilot",
  },
  {
    id: "irma",
    name: "IRMA",
    mission: "Skicka ett avtal, se om det är läst och bekräftat.",
    question: "Har motparten läst och bekräftat avtalet?",
    does: "Skickar avtalet. Visar om det är öppnat, signerat eller avvisat.",
    doesNot: "IRMA är inte e-post och inte ett arkiv för alla dokument.",
    owns: ["irma.agreements"],
    status: "pilot",
  },
  {
    id: "tyra",
    name: "TYRA",
    mission: "Kund, bil, hjul och vad som ska göras härnäst.",
    question: "Vilken kund, vilken bil, vilka hjul — och vad är nästa steg?",
    does: "Håller ihop kund, fordon och däck. Visar när det är dags att byta eller hämta.",
    doesNot: "TYRA är inte ett allmänt kundregister för andra branscher.",
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
    mission: "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
    question: "Vad sa kunden, vad mättes — och vad är nästa steg?",
    does: "Tar emot vad som sagts och mätts. Visar anteckningen. Ställer ingen diagnos själv.",
    doesNot: "ALVA ställer ingen diagnos och ger inget råd.",
    owns: ["alva.cases", "alva.case_observations", "alva.case_measurements"],
    status: "deferred",
  },
];

export const FAMILY_LINKS: readonly FamilyLink[] = [
  {
    from: "identity",
    to: "alla produkter",
    via: "OIDC → kansli_session",
    meaning: "En inloggning. Produkterna läser inte varandras användarlistor.",
  },
  {
    from: "identity",
    to: "platform.events",
    via: "identity.session.started",
    meaning: "Lyckad inloggning skrivs i loggen. Det är ett kvitto, inte en uppgift att följa upp.",
  },
  {
    from: "tora",
    to: "britt",
    via: "tora.market.evaluated",
    meaning: "Bara när någon publicerar. Att läsa marknaden skapar ingen händelse.",
  },
  {
    from: "rita",
    to: "britt",
    via: "rita.analysis.completed | rita.analysis.blocked",
    meaning:
      "BRITT får bolagsnamn, hur många träffar det blev och om AI var med. Inte själva förslagen — de stannar i RITA.",
  },
  {
    from: "irma",
    to: "britt",
    via: "irma.agreement.created | irma.agreement.viewed | irma.agreement.signed | irma.agreement.cancelled",
    meaning: "Avtal skapat, öppnat, bekräftat eller återkallat.",
  },
  {
    from: "tyra",
    to: "britt",
    via: "tyra.case.created | tyra.case.completed | tyra.hub.link.issued | tyra.reminder.enqueued | tyra.reminder.blocked",
    meaning: "Ärende, kundlänk eller påminnelse i kö. Stoppad kö betyder inte skickat.",
  },
  {
    from: "alva",
    to: "britt",
    via: "alva.case.created",
    meaning: "Ett ärende är registrerat. Ingen diagnos följer förrän den är inkopplad.",
  },
  {
    from: "ekonomi",
    to: "britt",
    via: "ekonomi.invoice.issued | ekonomi.payment.recorded | ekonomi.revolut.sync.blocked",
    meaning: "Utfärdad faktura, bokad inbetalning eller en Revolut-hämtning som inte gick.",
  },
  {
    from: "ekonomi",
    to: "platform.events",
    via: "ekonomi.revolut.oauth.started | ekonomi.revolut.oauth.completed | ekonomi.revolut.oauth.failed | ekonomi.revolut.connection.action_required | ekonomi.revolut.connection.disconnected | ekonomi.revolut.certificate.expiry_warning",
    meaning:
      "Bankanslutningens livscykel. Vanlig förnyelse loggas som drift, inte som något att följa upp.",
  },
  {
    from: "ekonomi",
    to: "platform.events",
    via: "ekonomi.invoice.created",
    meaning: "Utkast syns i loggen. Ingen bokföring förrän utfärdande.",
  },
  {
    from: "kansli",
    to: "britt",
    via: "kansli.task.created",
    meaning: "Intern uppgift syns hos BRITT. Kansli äger fortfarande uppgiften.",
  },
  {
    from: "kansli",
    to: "britt",
    via: "kansli.intake.received | kansli.account.provisioned",
    meaning: "En anmälan har kommit in, eller ett verkstadskonto skapats inför demon.",
  },
  {
    from: "britt",
    to: "britt",
    via: "britt.finding.recorded",
    meaning:
      "De viktigaste träffarna från exempelanalysen blir saker att följa upp. Resten stannar i BRITT.",
  },
  {
    from: "britt",
    to: "platform.events",
    via: "britt.observation.recorded",
    meaning: "Varje sak att följa upp skrivs också i händelselistan.",
  },
];

export function familyPartyName(id: string): string {
  if (id === "alla produkter") return "alla produkter";
  if (id === "platform.events") return "händelselistan";
  return FAMILY_SYSTEMS.find((system) => system.id === id)?.name ?? id;
}

/** Produkter som tas in när de har egen data, sida och händelser. */
export const FAMILY_INCOMING =
  "Fler system är på väg. De får samma inloggning och egna uppgifter. Namn kommer när de är redo — inte före.";

export const FAMILY_BLOCKED = [
  {
    id: "rita-engine",
    need: "RITA:s analys måste vara inkopplad (på Vercel via URL, lokalt via programfilen) innan analyser kan köras.",
  },
  {
    id: "alva-repo",
    need: "Den guidade diagnosen kopplas när den är klar. Ärendet kan registreras redan nu.",
  },
  {
    id: "irma-sign",
    need: "IRMA stannar hos oss: enkel digital bekräftelse och en egen länk. Ingen BankID och ingen juridisk e-signatur än.",
  },
  {
    id: "britt-intel",
    need: "Fortnox, Revolut och BRITT:s profiler om exempelanalysen ska bli hela produkten.",
  },
  {
    id: "ekonomi-rails",
    need: "Stripe, Revolut och Swish när ni vill ta betalt den vägen. Faktura på 10 dagar fungerar utan dem.",
  },
] as const;
