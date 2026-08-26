import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { loadOpsSnapshot, opsScopeFor } from "@/lib/platform/ops";
import { getRuntime } from "@/lib/platform/runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const org = requireOrg(actor);
    const scope = opsScopeFor(org.orgRef);
    const db = scope === "house" ? getRuntime().pool : pool;
    const snapshot = await loadOpsSnapshot(db, {
      orgRef: org.orgRef,
      orgName: org.orgName,
      scope,
    });
    return json(snapshot);
  });
}
