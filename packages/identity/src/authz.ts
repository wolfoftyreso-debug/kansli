import { formatRef, platformRef, type TokenOrgContext } from "@pixdrift/contracts";
import type { IdentityStore } from "./store.ts";

export interface MembershipView {
  ref: string;
  name: string;
  roles: string[];
}

export function userSubject(userId: string): string {
  return formatRef(platformRef("user", userId));
}

export function orgRef(orgId: string): string {
  return formatRef(platformRef("org", orgId));
}

/** All organisations a user belongs to, for the id token / org switcher. */
export async function membershipsFor(store: IdentityStore, userId: string): Promise<MembershipView[]> {
  const memberships = await store.membershipsForUser(userId);
  const views: MembershipView[] = [];
  for (const membership of memberships) {
    const org = await store.findOrg(membership.orgId);
    if (!org) continue;
    views.push({ ref: orgRef(org.id), name: org.name, roles: membership.roleKeys });
  }
  return views;
}

/**
 * The active-organisation context: the union of permissions granted by the
 * user's roles in that org. Returns null when the user is not a member.
 */
export async function orgContext(
  store: IdentityStore,
  userId: string,
  orgId: string,
): Promise<TokenOrgContext | null> {
  const memberships = await store.membershipsForUser(userId);
  const membership = memberships.find((m) => m.orgId === orgId);
  if (!membership) return null;

  const org = await store.findOrg(orgId);
  if (!org) return null;

  const permissions = new Set<string>();
  for (const roleKey of membership.roleKeys) {
    const role = await store.findRole(roleKey);
    if (!role) continue;
    for (const permission of role.permissions) permissions.add(permission);
  }

  return {
    ref: orgRef(org.id),
    name: org.name,
    roles: membership.roleKeys,
    permissions: [...permissions].sort(),
  };
}

/** The org a token defaults to when the client did not request a specific one. */
export async function defaultOrgId(store: IdentityStore, userId: string): Promise<string | null> {
  const memberships = await store.membershipsForUser(userId);
  return memberships[0]?.orgId ?? null;
}
