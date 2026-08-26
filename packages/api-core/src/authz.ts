import { hasPermission } from "@pixdrift/contracts";
import { ApiError } from "./error.ts";

export interface Actor {
  sub: string;
  email: string;
  name: string;
  orgRef: string | null;
  orgName: string | null;
  tier: string;
  permissions: readonly string[];
}

export function requireActor(actor: Actor | null): Actor {
  if (!actor) throw new ApiError("unauthenticated", "Sign in with Pixdrift identity.");
  return actor;
}

export function requireOrg(actor: Actor | null): Actor & { orgRef: string } {
  const present = requireActor(actor);
  if (!present.orgRef) {
    throw new ApiError("forbidden", "Ingen aktiv organisation i sessionen.");
  }
  return present as Actor & { orgRef: string };
}

export function requirePermission(
  actor: Actor | null,
  permission: string,
): Actor & { orgRef: string } {
  const present = requireOrg(actor);
  if (!hasPermission(present.permissions, permission)) {
    throw new ApiError("forbidden", `Saknar behörighet ${permission}.`);
  }
  return present;
}
