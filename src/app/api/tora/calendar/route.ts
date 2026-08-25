import { handleApi, json } from "@/lib/platform/http";
import { loadToraCalendar, parseTier } from "@/lib/tora/market";
import { resolveCompany } from "@/lib/tora/profile";

export async function GET() {
  return handleApi(async ({ actor, pool }) => {
    const company = await resolveCompany(pool, actor?.orgRef ?? null);
    return json({
      product: "tora",
      calendar: loadToraCalendar(parseTier(actor?.tier), company),
    });
  });
}
