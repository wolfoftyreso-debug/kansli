export type SystemStatus = "operational" | "pilot" | "deferred";

export interface SystemModule {
  id: string;
  name: string;
  purpose: string;
  status: SystemStatus;
  /** Postgres schema this module owns. Null for identity (public). */
  schema: string | null;
  basePath: string;
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
    capabilities: ["oidc", "jwks", "session"],
  },
  {
    id: "kansli",
    name: "Kansli",
    purpose: "The hub: identity session, platform APIs, and internal tasks.",
    status: "operational",
    schema: "kansli",
    basePath: "/kansli",
    capabilities: ["tasks", "platform-api"],
  },
  {
    id: "tora",
    name: "TORA",
    purpose: "Public-procurement rights, eligibility and recommended action.",
    status: "pilot",
    schema: "tora",
    basePath: "/tora",
    capabilities: ["market", "eligibility", "legal-basis"],
  },
  {
    id: "rita",
    name: "RITA",
    purpose: "Verification and findings against financial records.",
    status: "pilot",
    schema: "rita",
    basePath: "/rita",
    capabilities: ["analysis", "findings"],
  },
  {
    id: "britt",
    name: "BRITT",
    purpose: "Operational observations and follow-up.",
    status: "pilot",
    schema: "britt",
    basePath: "/britt",
    capabilities: ["observations"],
  },
  {
    id: "irma",
    name: "IRMA",
    purpose: "Agreements and handovers to people outside the organisation.",
    status: "pilot",
    schema: "irma",
    basePath: "/irma",
    capabilities: ["agreements", "magic-link", "link-consume"],
  },
  {
    id: "alva",
    name: "ALVA",
    purpose: "Structured vehicle diagnosis. Domain engine arrives with the ALVA repo.",
    status: "deferred",
    schema: "alva",
    basePath: "/alva",
    capabilities: ["cases"],
  },
];

export function getModule(id: string): SystemModule | undefined {
  return SYSTEM_MODULES.find((module) => module.id === id);
}
