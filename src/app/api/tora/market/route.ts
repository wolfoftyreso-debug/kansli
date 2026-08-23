import { demoCompany } from "@pixdrift/tora";
import { handleApi, json } from "@/lib/platform/http";
import { evaluateAndStore } from "@/lib/tora/persist";
import { loadToraMarket, parseTier } from "@/lib/tora/market";

const DEMO_ORG = "pixdrift:org:org-exempelbolaget";

/**
 * TORA market. Engine runs in-process. Redaction is server-side.
 * A snapshot and a family event are written so BRITT (and anyone else)
 * can sync without reading TORA's tables.
 */
export async function GET() {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const tier = parseTier(actor?.tier);
    const orgRef = actor?.orgRef ?? DEMO_ORG;
    try {
      const stored = await evaluateAndStore({
        pool,
        events,
        orgRef,
        tier,
        actorRef: actor?.sub ?? null,
        requestId,
      });
      return json({
        product: "tora",
        company: stored.company,
        tier,
        snapshotId: stored.id,
        summary: stored.market.summary,
        openNow: stored.market.openNow,
        upcoming: stored.market.upcoming,
        watch: stored.market.watch,
        history: stored.market.history,
      });
    } catch (error) {
      // Engine must still answer if persistence is down — the product truth
      // is the evaluation, not the snapshot. Event/sync is best-effort here
      // only when the database itself is the failure; handleApi already maps
      // not_ready. Re-throw unexpected errors.
      if (error instanceof Error && /relation|does not exist/i.test(error.message)) {
        const market = loadToraMarket(tier);
        return json({
          product: "tora",
          company: demoCompany.name,
          tier,
          summary: market.summary,
          openNow: market.openNow,
          upcoming: market.upcoming,
          watch: market.watch,
          history: market.history,
          persisted: false,
        });
      }
      throw error;
    }
  });
}
