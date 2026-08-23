import { handleApi, json } from "@/lib/platform/http";
import { loadToraCalendar, parseTier } from "@/lib/tora/market";

export async function GET() {
  return handleApi(async ({ actor }) => {
    return json({ product: "tora", calendar: loadToraCalendar(parseTier(actor?.tier)) });
  });
}
