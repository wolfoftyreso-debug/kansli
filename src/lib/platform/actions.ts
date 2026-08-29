import { hasPermission } from "@pixdrift/contracts";
import { redirect } from "next/navigation";
import { readSession, type AppSession } from "@/lib/auth/session";
import { safeNextPath, type AppNextPath } from "@/lib/auth/next";
import { runtimeForOrg, type PlatformRuntime } from "./runtime";

export type OrgActionContext = PlatformRuntime & {
  session: AppSession & { org: NonNullable<AppSession["org"]> };
};

export async function requireOrgAction(
  next: AppNextPath,
  permission?: string,
): Promise<OrgActionContext> {
  const dest = safeNextPath(next) ?? "/kansli";
  const session = await readSession();
  if (!session?.org?.ref) redirect(`/api/auth/login?next=${encodeURIComponent(dest)}`);
  if (permission && !hasPermission(session.org.permissions ?? [], permission)) {
    throw new Error(`Missing permission ${permission}.`);
  }
  return { session: session as OrgActionContext["session"], ...runtimeForOrg(session.org.ref) };
}
