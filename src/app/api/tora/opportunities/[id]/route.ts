import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { loadToraOpportunity, parseTier } from "@/lib/tora/market";
import { resolveCompany } from "@/lib/tora/profile";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor, pool }) => {
    const { id } = await context.params;
    const company = await resolveCompany(pool, actor?.orgRef ?? null);
    const detail = loadToraOpportunity(parseTier(actor?.tier), id, company);
    if (!detail) throw new ApiError("not_found", "The opportunity does not exist in the record.");
    return json({ product: "tora", opportunity: detail });
  });
}
