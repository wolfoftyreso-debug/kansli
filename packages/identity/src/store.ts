/**
 * Identity storage.
 *
 * The interface is what the provider depends on; the in-memory implementation
 * is what dev and tests run against. Production supplies a PostgreSQL adapter
 * with the `*_owner` / `*_app` split and row-level security described in RITA —
 * the provider never learns which one it is talking to.
 */

import { hashPassword } from "@pixdrift/auth-core";

export type UserStatus = "active" | "invited" | "suspended";
export type RoleScope = "organization" | "legalEntity" | "platform";

export interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  passwordHash: string;
}

export interface StoredLegalEntity {
  id: string;
  name: string;
  registrationNumber: string;
  country: string;
}

export interface StoredOrg {
  id: string;
  name: string;
  country: string;
  isDemo: boolean;
  /** Subscription entitlement (free|pro|professional|enterprise), emitted as `tier`. */
  tier: string;
  legalEntities: StoredLegalEntity[];
}

export interface StoredRole {
  key: string;
  label: string;
  scope: RoleScope;
  permissions: string[];
}

export interface StoredMembership {
  userId: string;
  orgId: string;
  roleKeys: string[];
}

export interface AuthCodeRecord {
  code: string;
  clientId: string;
  userId: string;
  orgId: string | null;
  redirectUri: string;
  codeChallenge: string;
  nonce: string | null;
  scope: string;
  expiresAt: number;
}

export interface IdentityStore {
  findUserByEmail(email: string): Promise<StoredUser | null>;
  findUserById(id: string): Promise<StoredUser | null>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  membershipsForUser(userId: string): Promise<StoredMembership[]>;
  findOrg(id: string): Promise<StoredOrg | null>;
  findRole(key: string): Promise<StoredRole | null>;
  saveAuthCode(record: AuthCodeRecord): Promise<void>;
  takeAuthCode(code: string): Promise<AuthCodeRecord | null>;
}

export class InMemoryStore implements IdentityStore {
  private users = new Map<string, StoredUser>();
  private orgs = new Map<string, StoredOrg>();
  private roles = new Map<string, StoredRole>();
  private memberships: StoredMembership[] = [];
  private authCodes = new Map<string, AuthCodeRecord>();

  addUser(user: StoredUser): void {
    this.users.set(user.id, user);
  }
  addOrg(org: StoredOrg): void {
    this.orgs.set(org.id, org);
  }
  addRole(role: StoredRole): void {
    this.roles.set(role.key, role);
  }
  addMembership(membership: StoredMembership): void {
    this.memberships.push(membership);
  }

  async findUserByEmail(email: string): Promise<StoredUser | null> {
    const normalised = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === normalised) return user;
    }
    return null;
  }
  async findUserById(id: string): Promise<StoredUser | null> {
    return this.users.get(id) ?? null;
  }
  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) user.passwordHash = passwordHash;
  }
  async membershipsForUser(userId: string): Promise<StoredMembership[]> {
    return this.memberships.filter((m) => m.userId === userId);
  }
  async findOrg(id: string): Promise<StoredOrg | null> {
    return this.orgs.get(id) ?? null;
  }
  async findRole(key: string): Promise<StoredRole | null> {
    return this.roles.get(key) ?? null;
  }
  async saveAuthCode(record: AuthCodeRecord): Promise<void> {
    this.authCodes.set(record.code, record);
  }
  async takeAuthCode(code: string): Promise<AuthCodeRecord | null> {
    const record = this.authCodes.get(code) ?? null;
    if (record) this.authCodes.delete(code);
    if (!record || record.expiresAt < Date.now()) return null;
    return record;
  }
}

/** Role catalogue shared by the family. Verb-on-noun permissions, open grammar. */
export const SEED_ROLES: StoredRole[] = [
  {
    key: "orgOwner",
    label: "Organisationsägare",
    scope: "organization",
    permissions: [
      "member:read",
      "member:invite",
      "member:manage",
      "automation:read",
      "automation:manage",
      "scan:read",
      "scan:run",
      "finding:read",
      "advisor:read",
      "document:read",
      "document:upload",
      "arende:read",
      "arende:write",
      "invoice:read",
      "invoice:approve",
      // TORA (offentlig marknad) scopes.
      "opportunity:read",
      "profile:read",
      "profile:write",
      "watchlist:read",
      "watchlist:write",
    ],
  },
  {
    key: "orgMember",
    label: "Medarbetare",
    scope: "organization",
    permissions: [
      "scan:read",
      "finding:read",
      "document:read",
      "arende:read",
      "invoice:read",
      "opportunity:read",
      "profile:read",
      "watchlist:read",
    ],
  },
  {
    key: "platformSupport",
    label: "Plattformssupport",
    scope: "platform",
    // Deliberately no customer-data permissions — enforced by
    // assertPlatformRoleIsSafe in @pixdrift/contracts.
    permissions: ["member:read", "automation:read"],
  },
];

export interface SeedResult {
  store: InMemoryStore;
  demoUserId: string;
  demoOrgId: string;
}

/** A deterministic demo tenant, matching RITA's documented demo login. */
export async function seededStore(): Promise<SeedResult> {
  const store = new InMemoryStore();
  for (const role of SEED_ROLES) store.addRole(role);

  const demoOrgId = "org-exempelbolaget";
  store.addOrg({
    id: demoOrgId,
    name: "Exempelbolaget AB",
    country: "SE",
    isDemo: true,
    tier: "enterprise",
    legalEntities: [
      {
        id: "le-exempelbolaget",
        name: "Exempelbolaget AB",
        registrationNumber: "5560000000",
        country: "SE",
      },
    ],
  });

  const demoUserId = "user-demo";
  store.addUser({
    id: demoUserId,
    email: "demo@exempelbolaget.se",
    displayName: "Demo Demosson",
    status: "active",
    passwordHash: await hashPassword("demo-losenord-1234"),
  });
  store.addMembership({ userId: demoUserId, orgId: demoOrgId, roleKeys: ["orgOwner"] });

  // A second org the same person advises, to exercise cross-org identity.
  const secondOrgId = "org-nordvik";
  store.addOrg({
    id: secondOrgId,
    name: "Nordvik Verkstad AB",
    country: "SE",
    isDemo: true,
    tier: "pro",
    legalEntities: [
      { id: "le-nordvik", name: "Nordvik Verkstad AB", registrationNumber: "5569999999", country: "SE" },
    ],
  });
  store.addMembership({ userId: demoUserId, orgId: secondOrgId, roleKeys: ["orgMember"] });

  return { store, demoUserId, demoOrgId };
}
