import { ApiError, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { requireMajHouse } from "@/lib/maj/access";
import { getAction } from "@/lib/maj/engine";
import { decideAction } from "@/lib/maj/releases";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "arende:write");
    requireMajHouse(present.orgRef);
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { decision?: string } | null;
    if (body?.decision !== "approved" && body?.decision !== "declined") {
      throw new ApiError("invalid_request", "decision must be approved or declined.");
    }
    const action = await getAction(pool, present.orgRef, id);
    if (!action) throw new ApiError("not_found", "The decision does not exist.");
    await decideAction({
      pool,
      events,
      orgRef: present.orgRef,
      actorRef: present.sub,
      actionId: id,
      decision: body.decision,
      requestId,
    });
    return json({ actionId: id, decision: body.decision, projectId: action.projectId });
  });
}
