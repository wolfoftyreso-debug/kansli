import { ApiError } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { loadToraOpportunity, parseTier } from "@/lib/tora/market";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async ({ actor }) => {
    const { id } = await context.params;
    const detail = loadToraOpportunity(parseTier(actor?.tier), id);
    if (!detail) throw new ApiError("not_found", "Möjligheten finns inte i underlaget.");
    return json({ product: "tora", opportunity: detail });
  });
}
