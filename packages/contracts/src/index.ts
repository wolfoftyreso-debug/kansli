/**
 * @pixdrift/contracts — Platform contracts.
 *
 * The entities that a family of systems shares: who someone is, what they may
 * do, where data comes from, what runs on a schedule, what gets produced, and
 * what happened. Each product implements them from its own tables; none has to
 * know another's schema — only about this shape.
 *
 * Promoted, unchanged in spirit, from RITA's `packages/contracts` (ADR 0004):
 * a shared contract that lives inside one system's source tree is that system's
 * type file with ambitions. As its own versioned package the question "can
 * these deploy independently" has an answer: yes, while they agree on a major.
 *
 * What belongs here: identity, authorisation, data sources, automations,
 * notifications, artifacts, audit. What does not: any single product's domain
 * (findings, rule sets, diagnostic gates, öre). The line is worth defending.
 */

import { z } from "zod";

export const CONTRACTS_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * A globally unique reference to something in the family, `system:kind:id`.
 * A bare UUID works right up until two systems both have a `document` table
 * and somebody joins them.
 */
export const GlobalRef = z.object({
  system: z.string().min(1).max(32).regex(/^[a-z][a-z0-9-]*$/),
  kind: z.string().min(1).max(64).regex(/^[a-z][a-zA-Z0-9]*$/),
  id: z.string().min(1).max(128),
});
export type GlobalRef = z.infer<typeof GlobalRef>;

export function formatRef(ref: GlobalRef): string {
  return `${ref.system}:${ref.kind}:${ref.id}`;
}

export function parseRef(value: string): GlobalRef {
  const parts = value.split(":");
  if (parts.length !== 3) {
    throw new TypeError(`${value} är inte en global referens (system:kind:id)`);
  }
  return GlobalRef.parse({ system: parts[0], kind: parts[1], id: parts[2] });
}

/** ISO 8601, UTC. Stored as a string so a contract never depends on a Date. */
export const Timestamp = z.string().datetime();
export type Timestamp = z.infer<typeof Timestamp>;

/**
 * An amount, in the currency's minor unit, as a decimal string. A string and
 * not a number: a JSON number invites a consumer to parse it as a float.
 */
export const MinorAmount = z.object({
  currency: z.string().length(3).regex(/^[A-Z]{3}$/),
  minorUnits: z.string().regex(/^-?\d+$/),
});
export type MinorAmount = z.infer<typeof MinorAmount>;

// ---------------------------------------------------------------------------
// Identity and authorisation
// ---------------------------------------------------------------------------

/**
 * A person. Not scoped to an organisation: one accountant advises several
 * companies, and a copy per organisation is a password reset that fixes one
 * login in three.
 */
export const User = z
  .object({
    ref: GlobalRef,
    email: z.string().email(),
    displayName: z.string().min(1),
    status: z.enum(["active", "invited", "suspended"]),
    createdAt: Timestamp,
  })
  .loose();
export type User = z.infer<typeof User>;

/**
 * A customer organisation — the tenant boundary. `legalEntities` are the
 * companies inside it; access is granted at the group while a scan is about one
 * company.
 */
export const Organization = z
  .object({
    ref: GlobalRef,
    name: z.string().min(1),
    country: z.string().length(2).regex(/^[A-Z]{2}$/),
    isDemo: z.boolean().default(false),
    legalEntities: z.array(
      z
        .object({
          ref: GlobalRef,
          name: z.string().min(1),
          registrationNumber: z.string().min(1),
          country: z.string().length(2),
        })
        .loose(),
    ),
    createdAt: Timestamp,
  })
  .loose();
export type Organization = z.infer<typeof Organization>;

/**
 * Permissions, as verb-on-noun strings. Open rather than an enum, on purpose:
 * a second system in the family will have nouns another has never heard of.
 * The grammar is enforced so `scan:read` and `invoice:approve` are valid and
 * `deleteEverything` is not.
 */
export const Permission = z.string().regex(/^[a-z][a-zA-Z0-9]*:[a-z][a-zA-Z0-9]*$/);
export type Permission = z.infer<typeof Permission>;

/**
 * A named bundle of permissions. `scope` says where a role means anything.
 * Platform roles deliberately cannot be granted customer-data permissions.
 */
export const Role = z
  .object({
    key: z.string().min(1).max(64).regex(/^[a-z][a-zA-Z0-9]*$/),
    label: z.string().min(1),
    scope: z.enum(["organization", "legalEntity", "platform"]),
    permissions: z.array(Permission),
  })
  .loose();
export type Role = z.infer<typeof Role>;

/** A user's roles inside one organisation. */
export const Membership = z
  .object({
    ref: GlobalRef,
    user: GlobalRef,
    organization: GlobalRef,
    roles: z.array(z.string()).min(1),
    createdAt: Timestamp,
  })
  .loose();
export type Membership = z.infer<typeof Membership>;

/**
 * Permissions that must never be attached to a platform-scoped role. Platform
 * staff run the service; they do not read customers' content. The guarantee is
 * that the grant does not exist, rather than that a filter remembers.
 */
export const CUSTOMER_DATA_PERMISSION_PREFIXES = [
  "document:",
  "scan:",
  "finding:",
  "ledger:",
  "advisor:",
  "arende:",
] as const;

export function assertPlatformRoleIsSafe(role: Role): void {
  if (role.scope !== "platform") return;
  const offending = role.permissions.filter((permission) =>
    CUSTOMER_DATA_PERMISSION_PREFIXES.some((prefix) => permission.startsWith(prefix)),
  );
  if (offending.length > 0) {
    throw new Error(
      `plattformsrollen ${role.key} får inte ha behörighet till kunddata: ${offending.join(", ")}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Data sources and connectors
// ---------------------------------------------------------------------------

export const DataSourceKind = z.enum([
  "upload",
  "accounting",
  "payroll",
  "banking",
  "registry",
  "manual",
]);
export type DataSourceKind = z.infer<typeof DataSourceKind>;

export const DataSource = z
  .object({
    ref: GlobalRef,
    organization: GlobalRef,
    legalEntity: GlobalRef.nullable(),
    kind: DataSourceKind,
    connector: GlobalRef.nullable(),
    displayName: z.string().min(1),
    status: z.enum(["connected", "disconnected", "error", "expired"]),
    grantedScopes: z.array(z.string()).default([]),
    lastSyncedAt: Timestamp.nullable(),
    createdAt: Timestamp,
  })
  .loose();
export type DataSource = z.infer<typeof DataSource>;

export const ConnectorCapabilities = z
  .object({
    read: z.boolean(),
    write: z.boolean(),
    incrementalSync: z.boolean(),
    attachments: z.boolean(),
    webhooks: z.boolean(),
  })
  .loose();
export type ConnectorCapabilities = z.infer<typeof ConnectorCapabilities>;

export const Connector = z
  .object({
    ref: GlobalRef,
    key: z.string().min(1),
    displayName: z.string().min(1),
    vendor: z.string().min(1),
    kind: DataSourceKind,
    capabilities: ConnectorCapabilities,
    version: z.string().min(1),
  })
  .loose();
export type Connector = z.infer<typeof Connector>;

// ---------------------------------------------------------------------------
// Automations
// ---------------------------------------------------------------------------

export const AutomationTrigger = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("schedule"),
      cron: z.string().min(1),
      timezone: z.string().min(1).default("Europe/Stockholm"),
    })
    .loose(),
  z
    .object({
      type: z.literal("event"),
      event: z.string().min(1),
      condition: z
        .object({
          minEstimatedValue: MinorAmount.optional(),
          categories: z.array(z.string()).optional(),
        })
        .loose()
        .optional(),
    })
    .loose(),
]);
export type AutomationTrigger = z.infer<typeof AutomationTrigger>;

export const AutomationStatus = z.enum(["active", "paused", "failing", "archived"]);
export type AutomationStatus = z.infer<typeof AutomationStatus>;

export const Automation = z
  .object({
    ref: GlobalRef,
    organization: GlobalRef,
    legalEntity: GlobalRef.nullable(),
    naturalLanguage: z.string().min(1),
    summary: z.string().min(1),
    trigger: AutomationTrigger,
    status: AutomationStatus,
    owner: GlobalRef,
    lastRunAt: Timestamp.nullable(),
    nextRunAt: Timestamp.nullable(),
    lastOutcome: z.enum(["succeeded", "failed", "skipped", "never"]).default("never"),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  })
  .loose();
export type Automation = z.infer<typeof Automation>;

// ---------------------------------------------------------------------------
// Notifications, artifacts, audit
// ---------------------------------------------------------------------------

export const Notification = z
  .object({
    ref: GlobalRef,
    organization: GlobalRef,
    recipient: GlobalRef,
    kind: z.string().min(1),
    title: z.string().min(1),
    body: z.string().default(""),
    subject: GlobalRef.nullable(),
    severity: z.enum(["info", "attention", "urgent"]).default("info"),
    channels: z.array(z.enum(["inApp", "email", "webhook"])).default(["inApp"]),
    readAt: Timestamp.nullable(),
    createdAt: Timestamp,
  })
  .loose();
export type Notification = z.infer<typeof Notification>;

export const Artifact = z
  .object({
    ref: GlobalRef,
    organization: GlobalRef,
    legalEntity: GlobalRef.nullable(),
    kind: z.string().min(1),
    title: z.string().min(1),
    contentType: z.string().min(1),
    storageKey: z.string().nullable().default(null),
    sha256: z.string().regex(/^[0-9a-f]{64}$/).nullable().default(null),
    byteLength: z.number().int().nonnegative().nullable().default(null),
    producedBy: GlobalRef.nullable(),
    createdAt: Timestamp,
  })
  .loose();
export type Artifact = z.infer<typeof Artifact>;

export const AuditEvent = z
  .object({
    ref: GlobalRef,
    organization: GlobalRef,
    occurredAt: Timestamp,
    actor: z
      .object({
        kind: z.enum(["user", "system", "automation", "support", "integration"]),
        ref: GlobalRef.nullable(),
      })
      .loose(),
    action: z.string().min(1),
    subject: GlobalRef.nullable(),
    detail: z.record(z.string(), z.unknown()).default({}),
    traceId: z.string().nullable().default(null),
  })
  .loose();
export type AuditEvent = z.infer<typeof AuditEvent>;

// ---------------------------------------------------------------------------
// Envelope
// ---------------------------------------------------------------------------

export const ContractEnvelope = z
  .object({
    contractsVersion: z.string().min(1),
    producedBy: z.string().min(1),
    producedAt: Timestamp,
    kind: z.string().min(1),
    payload: z.unknown(),
  })
  .loose();
export type ContractEnvelope = z.infer<typeof ContractEnvelope>;

export function majorOf(version: string): number {
  const major = Number(version.split(".")[0]);
  if (!Number.isInteger(major)) throw new TypeError(`${version} är inte en semver`);
  return major;
}

export function isCompatible(producerVersion: string): boolean {
  return majorOf(producerVersion) === majorOf(CONTRACTS_VERSION);
}

// ---------------------------------------------------------------------------
// Identity provider: OIDC token claims (Pixdrift SSO)
// ---------------------------------------------------------------------------

/** The system id that the central identity provider owns records under. */
export const PLATFORM_SYSTEM = "pixdrift";

export function platformRef(kind: string, id: string): GlobalRef {
  return GlobalRef.parse({ system: PLATFORM_SYSTEM, kind, id });
}

/** True when `granted` satisfies `required` (exact match or a `noun:*` grant). */
export function hasPermission(granted: readonly string[], required: string): boolean {
  if (granted.includes(required)) return true;
  const [noun] = required.split(":");
  return granted.includes(`${noun}:*`) || granted.includes("*:*");
}

/**
 * The organisation context an access/id token is scoped to. A token is always
 * about one active organisation; switching org means a new token.
 */
export const TokenOrgContext = z
  .object({
    ref: z.string().min(1),
    name: z.string().min(1),
    roles: z.array(z.string()),
    permissions: z.array(Permission),
  })
  .loose();
export type TokenOrgContext = z.infer<typeof TokenOrgContext>;

/**
 * ID token claims: who the user is. Standard OIDC claims plus the family's
 * `org`/`memberships`, so a client can render the session without a second
 * round trip.
 */
export const IdTokenClaims = z
  .object({
    iss: z.string().min(1),
    sub: z.string().min(1),
    aud: z.union([z.string(), z.array(z.string())]),
    exp: z.number(),
    iat: z.number(),
    nonce: z.string().optional(),
    email: z.string().email(),
    email_verified: z.boolean().default(false),
    name: z.string().min(1),
    org: TokenOrgContext.nullable().default(null),
    memberships: z
      .array(z.object({ ref: z.string(), name: z.string(), roles: z.array(z.string()) }).loose())
      .default([]),
  })
  .loose();
export type IdTokenClaims = z.infer<typeof IdTokenClaims>;

/**
 * Access token claims: what a resource server (e.g. ALVA, RITA) needs to
 * authorise a request. `aud` names the resource; `permissions` are the
 * flattened grants for the active `org`.
 */
export const AccessTokenClaims = z
  .object({
    iss: z.string().min(1),
    sub: z.string().min(1),
    aud: z.union([z.string(), z.array(z.string())]),
    exp: z.number(),
    iat: z.number(),
    scope: z.string().default(""),
    org: z.string().nullable().default(null),
    roles: z.array(z.string()).default([]),
    permissions: z.array(Permission).default([]),
  })
  .loose();
export type AccessTokenClaims = z.infer<typeof AccessTokenClaims>;
