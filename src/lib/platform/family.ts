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
  owns: string;
  status: SystemStatus;
}

export interface FamilyLink {
  from: string;
  to: string;
  via: string;
  meaning: string;
}

export const FAMILY_PRINCIPLE =
  "Alla system har samma inloggning och en gemensam händelselista, men varje system äger sin egen information. RITA letar skattebesparingar, TORA bedömer upphandlingar — två olika jobb.";

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
    layer: "Motorer",
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
    mission: "En nyckel till hela huset.",
    question: "Vem är du, och för vilken organisation?",
    does: "Logga in en gång. Kansli tar emot er och håller er inloggade i hela huset.",
    doesNot: "Ingen produktyta. Ingen extra inloggningsfaktor. Ingen fakturering här.",
    owns: "public (users, orgs, clients, keys)",
    status: "operational",
  },
  {
    id: "kansli",
    name: "Kansli",
    mission: "Receptionen. Inte fabriken.",
    question: "Var loggar jag in, och vad ska vi göra internt?",
    does: "Receptionen: inloggning, intern uppgiftstavla och formuläret för nya kunder.",
    doesNot:
      "Ingen produktlogik. Inga andras uppgifter. Formuläret är en anmälan, inte ett sålt avtal.",
    owns: "kansli.tasks, kansli.intakes",
    status: "operational",
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    mission: "En bok för hela huset. Fordran, moms, inbetalning.",
    question: "Vad är bokat, vad är förfallet, och hur kom pengarna in?",
    does: "Utfärdar faktura på 10 dagar, bokför i öre mot BAS, exporterar moms och verifikat. Ansluter Stripe och Revolut. Matchar inbetalningar när banken är kopplad.",
    doesNot:
      "Inte Fortnox. Ingen Swish-kod som inte fungerar. Inga kortbetalningar utan Stripe. Inget simuleras utan att du sagt ja.",
    owns: "ekonomi.accounts, ekonomi.transactions, ekonomi.entries, ekonomi.invoices, ekonomi.payments, ekonomi.connectors",
    status: "pilot",
  },
  {
    id: "tora",
    name: "TORA",
    mission: "Ska vi lägga tid på den här upphandlingen?",
    question: "Får det här bolaget lämna anbud — och vad gör vi nu?",
    does: "Bedömer upphandlingar efter er plan: marknad, detaljer och kalender. När ni delar läget sparas en ögonblicksbild.",
    doesNot: "Kollar inte räkenskaperna. Det gör RITA.",
    owns: "tora.market_snapshots",
    status: "pilot",
  },
  {
    id: "rita",
    name: "RITA",
    mission: "Hitta skattemässiga besparingar i underlaget — avdrag, moms, K10, pension, FoU.",
    question: "Vilka skatteutrymmen sitter i böckerna, och vad ska vi kolla?",
    does: "Läser bokslutet mot svenska skatteregler och lämnar fynd. Utan analys: nya jobb stannar. Fynd är preliminära — inte skatteråd.",
    doesNot:
      "Inga påhittade resultat. Avgör inte om ni får lämna anbud. Ingen kunduppladdning än. Ingen garanti om återbäring.",
    owns: "rita.analyses",
    status: "pilot",
  },
  {
    id: "britt",
    name: "BRITT",
    mission: "Vad ska någon göra nu, utifrån det som faktiskt hänt?",
    question: "Vad har hänt som någon behöver följa upp?",
    does: "En inkorg för sådant som behöver följas upp, plus en exempelanalys av omsättning, kassa och största kund.",
    doesNot:
      "Inte Fortnox, Revolut eller hela underrättelseprodukten. Läser inte andras uppgifter direkt.",
    owns: "britt.observations, britt.findings, britt.metric_snapshots, britt.analysis_runs",
    status: "pilot",
  },
  {
    id: "irma",
    name: "IRMA",
    mission:
      "Digitalisera verksamhetens avtalshantering: ett flöde, koll på varje avtal, slut på pappersjakten.",
    question: "Vilket avtal ska ut, vem ska läsa det, och var är det nu?",
    does: "Skapar avtal med villkor och en länk som gäller 14 dagar. Motparten öppnar länken, läser och bekräftar. Allt får ett digitalt kvitto.",
    doesNot:
      "Inget komplett dokumentarkiv än. Ingen juridisk e-signatur. Ingen BankID. Inga starkare signeringsnivåer än.",
    owns: "irma.agreements",
    status: "pilot",
  },
  {
    id: "tyra",
    name: "TYRA",
    mission: "Modern däckhotell-administration: CRM, offert, lager och kundflöde i ett.",
    question: "Vilket fordon, vilken kund, vilket lager — och vad är nästa steg?",
    does: "Ärende, kund, fordon, nästa steg och en kundlänk. Påminnelser läggs i kö. Inga live-priser än.",
    doesNot:
      "Fullt lager och live-priser är inte inkopplade än. Ingen Fortnox. Ingen BankID. Inga SMS eller mejl skickas än.",
    owns: "tyra.customers, tyra.vehicles, tyra.tire_cases, tyra.customer_hub_links, tyra.reminder_outbox, tyra.tenant_supplier_accounts",
    status: "pilot",
  },
  {
    id: "alva",
    name: "ALVA",
    mission:
      "Guidad diagnosprocess med full dokumentation — tid och feljakt sparas för verkstad, kund och försäkring.",
    question: "Vad sa kunden, och hur tar vi oss till ett protokoll alla kan följa?",
    does: "Registrerar ärendet och ett tomt protokoll: status, anteckning, kontroller och mätvärden. Ingen slutsats från systemet.",
    doesNot:
      "Den guidade diagnosen är inte inkopplad än. Inga påhittade fynd. Systemet hittar aldrig på något.",
    owns: "alva.cases, alva.case_observations, alva.case_measurements",
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
      "BRITT får bolagsnamn, fyndantal och om AI var med. Inte själva fynden — de stannar i RITA.",
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
      "Bankanslutningens livscykel. Vanlig förnyelse loggas som drift, inte som en händelse i pärmen.",
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
    meaning: "Intern uppgift syns som observation. Kansli äger fortfarande uppgiften.",
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
      "Höga fynd från exempelanalysen blir observationer. Medel och låg stannar bland fynden.",
  },
  {
    from: "britt",
    to: "platform.events",
    via: "britt.observation.recorded",
    meaning: "Varje observation är själv en händelse, så loggen är komplett.",
  },
];

/** Produkter som tas in som första-klass när de har schema, UI, API och events. */
export const FAMILY_INCOMING =
  "Fler moduler är på väg in i samma hus: samma inloggning, egen pärm, lappar i händelseboken. De får namn när de är redo — inte före.";

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
