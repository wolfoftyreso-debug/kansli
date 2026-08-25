export const SYSTEM_IDS = [
  "identity",
  "kansli",
  "ekonomi",
  "tora",
  "rita",
  "britt",
  "irma",
  "tyra",
  "alva",
] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

export type SystemStatus = "operational" | "pilot" | "deferred";

export const EVENT_KINDS = [
  "identity.session.started",
  "kansli.task.created",
  "kansli.task.updated",
  "kansli.intake.received",
  "kansli.account.provisioned",
  "kansli.mcp.invoked",
  "kansli.mcp.denied",
  "ekonomi.invoice.created",
  "ekonomi.invoice.issued",
  "ekonomi.payment.recorded",
  "ekonomi.payment.matched",
  "ekonomi.connector.configured",
  "ekonomi.revolut.sync.blocked",
  "ekonomi.revolut.oauth.started",
  "ekonomi.revolut.oauth.completed",
  "ekonomi.revolut.oauth.failed",
  "ekonomi.revolut.connection.action_required",
  "ekonomi.revolut.connection.disconnected",
  "ekonomi.revolut.certificate.expiry_warning",
  "tora.market.evaluated",
  "rita.analysis.requested",
  "rita.analysis.completed",
  "rita.analysis.blocked",
  "britt.observation.recorded",
  "britt.finding.recorded",
  "irma.agreement.created",
  "irma.agreement.viewed",
  "irma.agreement.signed",
  "irma.agreement.cancelled",
  "tyra.case.created",
  "tyra.case.completed",
  "tyra.hub.link.issued",
  "tyra.reminder.enqueued",
  "tyra.reminder.blocked",
  "alva.case.created",
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

/**
 * One row per system. This is the workspace contract: schema, UI, API,
 * domain folder, and the event kinds the system is allowed to publish.
 * Products never share schemas. Identity lives in `public`.
 */
export interface SystemModule {
  id: SystemId;
  name: string;
  purpose: string;
  status: SystemStatus;
  /** Postgres schema this module owns. Null for identity (`public`). */
  schema: string | null;
  basePath: string;
  /** JSON/protocol base. Identity is the OIDC mount, not `/api/identity`. */
  apiBase: string;
  /** Domain code, relative to the repo root. */
  domainDir: string;
  eventKinds: readonly EventKind[];
  capabilities: readonly string[];
}

export const SYSTEM_MODULES: readonly SystemModule[] = [
  {
    id: "identity",
    name: "PIXDRIFT Identity",
    purpose: "En inloggning till alla system.",
    status: "operational",
    schema: null,
    basePath: "/idp",
    apiBase: "/idp",
    domainDir: "packages/identity",
    eventKinds: ["identity.session.started"],
    capabilities: ["oidc", "jwks", "session"],
  },
  {
    id: "kansli",
    name: "Kansli",
    purpose: "Startsidan. Uppgifter och vägen in.",
    status: "operational",
    schema: "kansli",
    basePath: "/kansli",
    apiBase: "/api/kansli",
    domainDir: "src/lib/kansli",
    eventKinds: [
      "kansli.task.created",
      "kansli.task.updated",
      "kansli.intake.received",
      "kansli.account.provisioned",
      "kansli.mcp.invoked",
      "kansli.mcp.denied",
    ],
    capabilities: ["tasks", "platform-api", "intake", "mcp"],
  },
  {
    id: "ekonomi",
    name: "Ekonomi",
    purpose: "Fakturor, moms och hur pengarna kom in.",
    status: "pilot",
    schema: "ekonomi",
    basePath: "/ekonomi",
    apiBase: "/api/ekonomi",
    domainDir: "src/lib/ekonomi",
    eventKinds: [
      "ekonomi.invoice.created",
      "ekonomi.invoice.issued",
      "ekonomi.payment.recorded",
      "ekonomi.payment.matched",
      "ekonomi.connector.configured",
      "ekonomi.revolut.sync.blocked",
      "ekonomi.revolut.oauth.started",
      "ekonomi.revolut.oauth.completed",
      "ekonomi.revolut.oauth.failed",
      "ekonomi.revolut.connection.action_required",
      "ekonomi.revolut.connection.disconnected",
      "ekonomi.revolut.certificate.expiry_warning",
    ],
    capabilities: ["ledger", "invoices", "vat", "payments", "connectors", "reports", "bank-oauth"],
  },
  {
    id: "tora",
    name: "TORA",
    purpose: "Vilka upphandlingar just ert bolag kan ta.",
    status: "pilot",
    schema: "tora",
    basePath: "/tora",
    apiBase: "/api/tora",
    domainDir: "src/lib/tora",
    eventKinds: ["tora.market.evaluated"],
    capabilities: ["market", "eligibility", "legal-basis", "calendar"],
  },
  {
    id: "rita",
    name: "RITA",
    purpose: "Letar skattebesparingar i era böcker.",
    status: "pilot",
    schema: "rita",
    basePath: "/rita",
    apiBase: "/api/rita",
    domainDir: "src/lib/rita",
    eventKinds: ["rita.analysis.requested", "rita.analysis.completed", "rita.analysis.blocked"],
    capabilities: ["analysis", "findings"],
  },
  {
    id: "britt",
    name: "BRITT",
    purpose: "Det som hänt och behöver följas upp.",
    status: "pilot",
    schema: "britt",
    basePath: "/britt",
    apiBase: "/api/britt",
    domainDir: "src/lib/britt",
    eventKinds: ["britt.observation.recorded", "britt.finding.recorded"],
    capabilities: ["observations", "findings"],
  },
  {
    id: "irma",
    name: "IRMA",
    purpose: "Skicka ett avtal, se om det är läst och bekräftat.",
    status: "pilot",
    schema: "irma",
    basePath: "/irma",
    apiBase: "/api/irma",
    domainDir: "src/lib/irma",
    eventKinds: [
      "irma.agreement.created",
      "irma.agreement.viewed",
      "irma.agreement.signed",
      "irma.agreement.cancelled",
    ],
    capabilities: [
      "agreements",
      "magic-link",
      "link-consume",
      "acknowledge",
      "revoke",
      "integrity-check",
      "title-search",
    ],
  },
  {
    id: "tyra",
    name: "TYRA",
    purpose: "Kund, bil, hjul och vad som ska göras härnäst.",
    status: "pilot",
    schema: "tyra",
    basePath: "/tyra",
    apiBase: "/api/tyra",
    domainDir: "src/lib/tyra",
    eventKinds: [
      "tyra.case.created",
      "tyra.case.completed",
      "tyra.hub.link.issued",
      "tyra.reminder.enqueued",
      "tyra.reminder.blocked",
    ],
    capabilities: ["cases", "workflow", "hub", "reminders", "supplier-accounts"],
  },
  {
    id: "alva",
    name: "ALVA",
    purpose: "Kundens fel, anteckningar och mätvärden. Diagnosen kommer senare.",
    status: "deferred",
    schema: "alva",
    basePath: "/alva",
    apiBase: "/api/alva",
    domainDir: "src/lib/alva",
    eventKinds: ["alva.case.created"],
    capabilities: ["cases"],
  },
];

export function getModule(id: string): SystemModule | undefined {
  return SYSTEM_MODULES.find((module) => module.id === id);
}

export function productModules(): readonly SystemModule[] {
  return SYSTEM_MODULES.filter((module) => module.id !== "identity");
}

export function isSystemId(value: string): value is SystemId {
  return (SYSTEM_IDS as readonly string[]).includes(value);
}

export function isEventKind(value: string): value is EventKind {
  return (EVENT_KINDS as readonly string[]).includes(value);
}
