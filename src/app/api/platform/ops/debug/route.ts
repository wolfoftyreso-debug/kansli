import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { lookupOpsDebug } from "@/lib/platform/ops-debug";
import { opsScopeFor } from "@/lib/platform/ops";
import { getRuntime } from "@/lib/platform/runtime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleApi(async ({ actor, pool }) => {
    const org = requireOrg(actor);
    const scope = opsScopeFor(org.orgRef);
    const db = scope === "house" ? getRuntime().pool : pool;
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return json(await lookupOpsDebug(db, { q, scope, orgRef: org.orgRef }));
  });
}
