/**
 * The PIXDRIFT systems catalog — a single structured source reused by the
 * homepage, the systems index, product pages, search, metadata and (later)
 * documentation and APIs. Content is never hardcoded into components.
 *
 * Truthfulness rule: descriptions stay at a level supported by what actually
 * exists. Where a system is still in development, its status says so and detail
 * sections read "forthcoming" rather than inventing capabilities.
 */

export type SystemStatus = "Operational" | "Development" | "Pilot";
export type Region = "Europe" | "United States" | "Global";

/**
 * The three possible outcomes for anything PIXDRIFT builds (doctrine §4).
 * Software becomes a MANAGED_PRODUCT only when PIXDRIFT is prepared to take
 * operational responsibility for it (hosting, security, support, lifecycle).
 */
export type Stewardship = "INTERNAL" | "OPEN_SOURCE" | "MANAGED_PRODUCT";

export const STEWARDSHIP_LABEL: Record<Stewardship, string> = {
  INTERNAL: "Internal",
  OPEN_SOURCE: "Open source",
  MANAGED_PRODUCT: "Managed product",
};

export interface SystemSection {
  /** Standardized product-page section id, e.g. "01". */
  no: string;
  title: string;
  /** Prose paragraphs; empty array renders a "forthcoming" note. */
  body: string[];
}

export interface PixSystem {
  /** Portfolio index, e.g. "01". */
  index: string;
  slug: string;
  name: string;
  /** One precise sentence. */
  purpose: string;
  category: string;
  status: SystemStatus;
  /** Which of the three outcomes this system is (doctrine §4). */
  stewardship: Stewardship;
  regions: Region[];
  /** Short summary for cards/metadata. */
  summary: string;
  /** Standardized sections 01–10 (Purpose … Availability). */
  sections: SystemSection[];
}

const sharedIdentityIntegration =
  "Connects to the family through PIXDRIFT Identity: a single sign-on and a verified access token (OIDC, Authorization Code + PKCE, asymmetric JWKS verification). No shared secrets, tenant derived from the token.";

function forthcoming(no: string, title: string): SystemSection {
  return { no, title, body: [] };
}

export const systems: PixSystem[] = [
  {
    index: "01",
    slug: "identity",
    name: "PIXDRIFT Identity",
    purpose: "One identity and single sign-on across every system in the family.",
    stewardship: "MANAGED_PRODUCT",
    category: "Platform infrastructure",
    status: "Operational",
    regions: ["Europe", "United States"],
    summary:
      "A self-hosted identity layer: one login, verified access tokens, and a client registry that new systems join without redeploying the core.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Give every PIXDRIFT system one identity and one sign-on, so people move between systems without a second login and each system can trust who is calling.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Organizations accumulate systems, each with its own accounts and secrets. Identity fragments, access drifts, and shared secrets leak between services.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: [
          "A self-hosted OpenID Connect provider: discovery, JWKS, authorize/login, token and userinfo endpoints, with a durable store and a rotating signing key.",
        ],
      },
      {
        no: "04",
        title: "How it works",
        body: [
          "Systems run the Authorization Code + PKCE flow and verify tokens against the provider's public keys (JWKS). A system can verify a token without ever being able to issue one.",
        ],
      },
      {
        no: "05",
        title: "Architecture",
        body: [
          "Stateless verification via published keys; a Postgres-backed store for users, organizations and the client registry; asymmetric ES256 signing with key rotation.",
        ],
      },
      forthcoming("06", "Applications"),
      {
        no: "07",
        title: "Integrations",
        body: [
          "Every other PIXDRIFT system integrates here. A new system is registered as one client entry — no change to the identity core.",
        ],
      },
      {
        no: "08",
        title: "Security",
        body: [
          "PKCE, single-use authorization codes, a redirect allowlist, asymmetric tokens and per-client authentication. Secrets never travel between resource servers.",
        ],
      },
      {
        no: "09",
        title: "Documentation",
        body: ["Technical reference under Documentation → Systems → Identity."],
      },
      {
        no: "10",
        title: "Availability",
        body: ["Operational. Europe and United States."],
      },
    ],
  },
  {
    index: "02",
    slug: "alva",
    name: "ALVA",
    purpose: "Structured vehicle diagnosis, from the customer's own words to a clear protocol.",
    stewardship: "MANAGED_PRODUCT",
    category: "Operational software",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Turns a customer complaint into a structured, evidence-based diagnostic case and a protocol everyone can understand.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Give a workshop a structured way to move from a customer complaint to an evidence-based root cause and a clear diagnosis protocol.",
        ],
      },
      {
        no: "02",
        title: "Problem",
        body: [
          "Diagnosis is often held in memory and notes. The reasoning, the measurements and the evidence are rarely captured in a way anyone can follow later.",
        ],
      },
      {
        no: "03",
        title: "System",
        body: [
          "A structured entity model — vehicle, work order, customer complaint, diagnosis session, diagnosis protocol — where each complaint owns its own independent diagnostic case.",
        ],
      },
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      {
        no: "09",
        title: "Documentation",
        body: ["In preparation. See the documentation coverage report."],
      },
      { no: "10", title: "Availability", body: ["In development. Europe."] },
    ],
  },
  {
    index: "03",
    slug: "rita",
    name: "RITA",
    purpose: "Verification and findings across financial and operational records.",
    stewardship: "MANAGED_PRODUCT",
    category: "Verification software",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Applies rules to records and produces findings, keeping the model's suggestions separate from the numbers the system computes.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Verify records against rules and surface findings, so the outcome is deterministic and the reasoning is auditable.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["In preparation."] },
      { no: "10", title: "Availability", body: ["In development. Europe."] },
    ],
  },
  {
    index: "04",
    slug: "tora",
    name: "TORA",
    purpose: "A register of rights and opportunities anchored to a stated legal basis.",
    stewardship: "MANAGED_PRODUCT",
    category: "Operational software",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Keeps rights and opportunities structured and traceable, where a right requires an explicit legal basis rather than an assumption.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Make rights and opportunities explicit and traceable, so a claim is backed by a stated basis rather than memory.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["In preparation."] },
      { no: "10", title: "Availability", body: ["In development. Europe."] },
    ],
  },
  {
    index: "05",
    slug: "irma",
    name: "IRMA",
    purpose: "Secure exchange of information with people outside the organization.",
    stewardship: "MANAGED_PRODUCT",
    category: "Operational software",
    status: "Development",
    regions: ["Europe"],
    summary:
      "Handles the handovers to external recipients — the small, exception-prone steps that fall between internal systems.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Move specific information to and from external recipients safely, without giving them an internal account.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["In preparation."] },
      { no: "10", title: "Availability", body: ["In development. Europe."] },
    ],
  },
  {
    index: "06",
    slug: "britt",
    name: "BRITT",
    purpose: "Focused operational workflow software for a specific, recurring task.",
    stewardship: "MANAGED_PRODUCT",
    category: "Operational software",
    status: "Development",
    regions: ["Europe"],
    summary:
      "A narrow tool for a recurring operational workflow that no larger system owns end to end.",
    sections: [
      {
        no: "01",
        title: "Purpose",
        body: [
          "Own one recurring operational workflow cleanly, rather than leaving it split across spreadsheets and email.",
        ],
      },
      forthcoming("02", "Problem"),
      forthcoming("03", "System"),
      forthcoming("04", "How it works"),
      forthcoming("05", "Architecture"),
      forthcoming("06", "Applications"),
      { no: "07", title: "Integrations", body: [sharedIdentityIntegration] },
      forthcoming("08", "Security"),
      { no: "09", title: "Documentation", body: ["In preparation."] },
      { no: "10", title: "Availability", body: ["In development. Europe."] },
    ],
  },
];

export function getSystem(slug: string): PixSystem | undefined {
  return systems.find((s) => s.slug === slug);
}

export const STATUS_COLOR_VAR: Record<SystemStatus, string> = {
  Operational: "var(--color-status-operational)",
  Development: "var(--color-status-development)",
  Pilot: "var(--color-status-pilot)",
};
