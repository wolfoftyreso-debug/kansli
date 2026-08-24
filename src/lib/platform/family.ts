import type { SystemId, SystemStatus } from "@pixdrift/systems";

/**
 * What each system does *in this repo today*, and how they connect.
 * Marketing copy lives elsewhere. This is the operating map.
 * Machine fields (id, schema, paths, events) live in `@pixdrift/systems`.
 */
export interface FamilySystem {
  id: SystemId;
  name: string;
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
  "Systemen delar identitet och en händelselogg. De delar aldrig tabeller. RITA verifierar räkenskaper. TORA avgör om ett bolag får lämna anbud. De är inte samma sak.";

export const FAMILY_SYSTEMS: readonly FamilySystem[] = [
  {
    id: "identity",
    name: "PIXDRIFT Identity",
    question: "Vem är du, och för vilken organisation?",
    does: "OIDC-inloggning (Authorization Code + PKCE), JWKS, användare, organisationer och medlemskap. Kansli tar emot koden och sätter en BFF-cookie (kansli_session).",
    doesNot: "Ingen produkt-UI. Ingen MFA. Ingen billing.",
    owns: "public (users, orgs, clients, keys)",
    status: "operational",
  },
  {
    id: "kansli",
    name: "Kansli",
    question: "Var loggar jag in, och vad ska vi göra internt?",
    does: "Navet: session, plattforms-API:er, intern uppgiftstavla. Samma process som hostar /idp och alla produkt-API:er.",
    doesNot: "Ingen produktlogik. Inga andras tabeller.",
    owns: "kansli.tasks",
    status: "operational",
  },
  {
    id: "tora",
    name: "TORA",
    question: "Får det här bolaget lämna anbud — på vilken rättslig grund, och vad gör vi nu?",
    does: "Kör upphandlingsmotorn i processen. GET utvärderar och redigerar efter nivå. Marknad, detalj, kalender. POST (Publicera) skriver en ögonblicksbild och en händelse.",
    doesNot: "Verifierar inte räkenskaper. Det är RITA.",
    owns: "tora.market_snapshots",
    status: "pilot",
  },
  {
    id: "rita",
    name: "RITA",
    question: "Stämmer räkenskaperna mot regelverket?",
    does: "Tar emot en analysbeställning, anropar den riktiga Rust-motorn via HTTP eller lokal binär, lagrar fynd eller blocked. Lokalt kan demonstrationsbokslutet skickas som underlag.",
    doesNot:
      "Ingen FakeAnalysisEngine i drift. Utan host eller RITA_ENGINE_BINARY blir status blocked. Avgör inte anbudsrätt. Ingen kunduppladdning via Blob.",
    owns: "rita.analyses",
    status: "pilot",
  },
  {
    id: "britt",
    name: "BRITT",
    question: "Vad har hänt som någon behöver följa upp?",
    does: "Observationsinkorg plus deterministisk demonstrationsanalys (omsättning, likviditet, koncentration). Skriver bara i britt-schemat.",
    doesNot:
      "Inte Fortnox, Revolut eller hela underrättelseprodukten. Ingen läsning av TORA/RITA-tabeller.",
    owns: "britt.observations, britt.findings, britt.metric_snapshots, britt.analysis_runs",
    status: "pilot",
  },
  {
    id: "irma",
    name: "IRMA",
    question: "Hur lämnar vi ett underlag till någon utanför organisationen?",
    does: "Skapar ett avtal med klausuler, hashar en magic link, motparten öppnar /irma/l/<token> och kan bekräfta. Första öppning = viewed. Bekräftelse = signed + SHA-256-artefakt.",
    doesNot: "Ingen kvalificerad e-signatur. Ingen BankID. Ingen fillagring (Blob/R2).",
    owns: "irma.agreements",
    status: "pilot",
  },
  {
    id: "alva",
    name: "ALVA",
    question: "Vad sa kunden, och vilket fall ska diagnostiseras?",
    does: "Registrerar ett diagnostiskt fall (klagomål, ev. fordon).",
    doesNot: "Ingen diagnosmotor, inga fynd, inga protokoll. Motorn anländer med ALVA-repot.",
    owns: "alva.cases",
    status: "deferred",
  },
];

export const FAMILY_LINKS: readonly FamilyLink[] = [
  {
    from: "identity",
    to: "alla produkter",
    via: "OIDC → kansli_session",
    meaning: "En inloggning. Produkten läser sessionen, inte varandras användartabeller.",
  },
  {
    from: "identity",
    to: "platform.events",
    via: "identity.session.started",
    meaning:
      "Lyckad inloggning skrivs i loggen. BRITT lyssnar inte — det är revision, inte en uppföljningsuppgift.",
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
    meaning: "BRITT får veta att ett underlag finns eller att motorn saknas. Inte fynden själva.",
  },
  {
    from: "irma",
    to: "britt",
    via: "irma.agreement.created | irma.agreement.viewed | irma.agreement.signed",
    meaning: "Avtal skapat, öppnat och bekräftat.",
  },
  {
    from: "alva",
    to: "britt",
    via: "alva.case.created",
    meaning: "Ett fall är registrerat. Ingen diagnos följer förrän motorn finns.",
  },
  {
    from: "kansli",
    to: "britt",
    via: "kansli.task.created",
    meaning: "Intern uppgift syns som observation. Kansli äger fortfarande tasks-raden.",
  },
  {
    from: "britt",
    to: "britt",
    via: "britt.finding.recorded",
    meaning:
      "Höga fynd från demonstrationsanalysen blir observationer. Medel och låg stannar i findings.",
  },
  {
    from: "britt",
    to: "platform.events",
    via: "britt.observation.recorded",
    meaning: "Varje observation är själv en händelse, så loggen är komplett.",
  },
];

export const FAMILY_BLOCKED = [
  {
    id: "rita-engine",
    need: "På Vercel: RITA_ENGINE_URL + RITA_ENGINE_TOKEN mot en host som kör skattjakt. Lokalt räcker RITA_ENGINE_BINARY + demonstrationsbokslutet.",
  },
  {
    id: "alva-repo",
    need: "Färdigt ALVA-repo innan diagnosmotorn kopplas. Fallet finns redan.",
  },
  {
    id: "irma-sign",
    need: "Kvalificerad e-signatur, BankID och Vercel Blob när bekräftelsen ska bli mer än en hashad förklaring.",
  },
  {
    id: "britt-intel",
    need: "Fortnox, Revolut och BRITT-repots profiler om demonstrationsanalysen ska bli hela produkten.",
  },
] as const;
