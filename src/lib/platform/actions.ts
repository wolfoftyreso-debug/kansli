import { redirect } from "next/navigation";
import { readSession, type AppSession } from "@/lib/auth/session";
import { safeNextPath, type AppNextPath } from "@/lib/auth/next";
import { getRuntime, type PlatformRuntime } from "./runtime";

export type OrgActionContext = PlatformRuntime & {
  session: AppSession & { org: NonNullable<AppSession["org"]> };
};

export async function requireOrgAction(next: AppNextPath): Promise<OrgActionContext> {
  const dest = safeNextPath(next) ?? "/kansli";
  const session = await readSession();
  if (!session?.org?.ref) redirect(`/api/auth/login?next=${encodeURIComponent(dest)}`);
  return { session: session as OrgActionContext["session"], ...getRuntime() };
}
