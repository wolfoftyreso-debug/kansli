import { ApiError, requireOrg, requirePermission } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { getAgreement, revokeAgreement } from "@/lib/irma/agreements";
import { verifyAgreementIntegrity } from "@/lib/irma/integrity";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const { id } = await context.params;
    const agreement = await getAgreement(pool, present.orgRef, id);
    if (!agreement) throw new ApiError("not_found", "The agreement does not exist.");
    return json({
      agreement,
      integrity: verifyAgreementIntegrity(agreement),
    });
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requirePermission(actor, "document:upload");
    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as { action?: string } | null;
    if (body?.action !== "revoke") {
      throw new ApiError("invalid_request", "action=revoke krävs.");
    }
    const agreement = await revokeAgreement({
      pool,
      events,
      orgRef: present.orgRef,
      id,
      actorRef: present.sub,
      requestId,
    });
    if (!agreement) throw new ApiError("not_found", "The agreement does not exist.");
    return json({ agreement });
  });
}
