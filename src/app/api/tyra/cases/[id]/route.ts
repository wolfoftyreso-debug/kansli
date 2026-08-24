import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { getCaseWorkCard } from "@/lib/tyra/cases";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const { id } = await context.params;
    const card = await getCaseWorkCard(pool, present.orgRef, id);
    if (!card) throw new ApiError("not_found", "Ärendet saknas.");
    return json({ case: card });
  });
}
