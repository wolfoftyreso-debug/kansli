import { demoCompany } from "@pixdrift/tora";
import { readSession } from "@/lib/auth/session";
import { loadToraMarket, parseTier } from "@/lib/tora/market";

/**
 * TORA market summary. The engine runs in-process; redaction is applied
 * server-side from the caller's tier so a client cannot request a field it
 * was never handed.
 */
export async function GET() {
  const session = await readSession();
  const tier = parseTier(session?.org?.tier);
  const market = loadToraMarket(tier);
  return Response.json({
    product: "tora",
    company: demoCompany.name,
    tier,
    summary: market.summary,
    openNow: market.openNow,
    upcoming: market.upcoming,
    watch: market.watch,
    history: market.history,
  });
}

