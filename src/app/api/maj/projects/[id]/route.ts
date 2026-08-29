import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { requireMajHouse } from "@/lib/maj/access";
import { capabilityStatuses, listActions, listSignals } from "@/lib/maj/engine";
import { getProject } from "@/lib/maj/projects";
import { listReleases } from "@/lib/maj/releases";
import { usageTotals } from "@/lib/maj/usage";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    requireMajHouse(present.orgRef);
    const { id } = await context.params;
    const project = await getProject(pool, present.orgRef, id);
    if (!project) throw new ApiError("not_found", "The project does not exist.");
    const [actions, releases, signals, usage] = await Promise.all([
      listActions(pool, present.orgRef, project.id),
      listReleases(pool, present.orgRef, project.id),
      listSignals(pool, present.orgRef, project.id),
      usageTotals(pool, present.orgRef, project.id),
    ]);
    return json({
      project,
      actions,
      releases,
      signals,
      usage,
      capabilities: capabilityStatuses(),
    });
  });
}
