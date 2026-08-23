import { ApiError, requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { getAnalysis } from "@/lib/rita/analyses";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return handleApi(async ({ actor, pool }) => {
    const present = requireOrg(actor);
    const { id } = await context.params;
    const analysis = await getAnalysis(pool, present.orgRef, id);
    if (!analysis) throw new ApiError("not_found", "Analysen finns inte.");
    return json({ analysis });
  });
}
