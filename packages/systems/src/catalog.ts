export const SYSTEM_IDS = ["identity", "kansli", "tora", "rita", "britt", "irma", "alva"] as const;
export type SystemId = (typeof SYSTEM_IDS)[number];

export type SystemStatus = "operational" | "pilot" | "deferred";

export const EVENT_KINDS = [
  "identity.session.started",
  "kansli.task.created",
  "kansli.task.updated",
  "tora.market.evaluated",
  "rita.analysis.requested",
  "rita.analysis.completed",
  "rita.analysis.blocked",
  "britt.observation.recorded",
  "britt.finding.recorded",
  "irma.agreement.created",
  "irma.agreement.viewed",
  "irma.agreement.signed",
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
    purpose: "One login and verified tokens for every system.",
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
    purpose: "The hub: identity session, platform APIs, and internal tasks.",
    status: "operational",
    schema: "kansli",
    basePath: "/kansli",
    apiBase: "/api/kansli",
    domainDir: "src/lib/kansli",
    eventKinds: ["kansli.task.created", "kansli.task.updated"],
    capabilities: ["tasks", "platform-api"],
  },
  {
    id: "tora",
    name: "TORA",
    purpose: "Public-procurement rights, eligibility and recommended action.",
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
    purpose: "Verification and findings against financial records.",
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
    purpose: "Operational observations and follow-up.",
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
    purpose: "Agreements and handovers to people outside the organisation.",
    status: "pilot",
    schema: "irma",
    basePath: "/irma",
    apiBase: "/api/irma",
    domainDir: "src/lib/irma",
    eventKinds: ["irma.agreement.created", "irma.agreement.viewed", "irma.agreement.signed"],
    capabilities: ["agreements", "magic-link", "link-consume", "acknowledge"],
  },
  {
    id: "alva",
    name: "ALVA",
    purpose: "Structured vehicle diagnosis. Domain engine arrives with the ALVA repo.",
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
