import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { requireMajHouse } from "@/lib/maj/access";
import { listActions } from "@/lib/maj/engine";
import { getProject } from "@/lib/maj/projects";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    requireMajHouse(present.orgRef);
    const { id } = await context.params;
    const project = await getProject(pool, present.orgRef, id);
    if (!project) throw new ApiError("not_found", "The project does not exist.");
    return json({
      projectId: project.id,
      actions: await listActions(pool, present.orgRef, project.id),
    });
  });
}
