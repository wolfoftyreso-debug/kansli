import { ApiError, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { requireMajHouse } from "@/lib/maj/access";
import { runAnalysis } from "@/lib/maj/engine";
import { getProject } from "@/lib/maj/projects";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    requireMajHouse(present.orgRef);
    const { id } = await context.params;
    const project = await getProject(pool, present.orgRef, id);
    if (!project) throw new ApiError("not_found", "The project does not exist.");
    const analysis = await runAnalysis({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      project,
      requestId,
    });
    return json({ projectId: project.id, analysis });
  });
}
