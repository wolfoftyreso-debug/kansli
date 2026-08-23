import { requireOrg } from "@pixdrift/api-core";
import { handleApi, json } from "@/lib/platform/http";
import { parseTier } from "@/lib/tora/market";
import { evaluateMarket, persistSnapshot } from "@/lib/tora/persist";

function marketBody(
  evaluated: ReturnType<typeof evaluateMarket>,
  extra: Record<string, unknown> = {},
) {
  return {
    product: "tora",
    company: evaluated.company,
    tier: evaluated.tier,
    summary: evaluated.market.summary,
    openNow: evaluated.market.openNow,
    upcoming: evaluated.market.upcoming,
    watch: evaluated.market.watch,
    history: evaluated.market.history,
    persisted: false,
    ...extra,
  };
}

/**
 * Evaluate only. Reading the market must not write a snapshot or publish to
 * the family — that flooded platform.events and BRITT on every page load.
 */
export async function GET() {
  return handleApi(async ({ actor }) => {
    return json(marketBody(evaluateMarket(parseTier(actor?.tier))));
  });
}

/** Persist the current evaluation and publish `tora.market.evaluated`. */
export async function POST() {
  return handleApi(async ({ actor, pool, events, requestId }) => {
    const present = requireOrg(actor);
    const stored = await persistSnapshot({
      pool,
      events,
      orgRef: present.orgRef,
      tier: parseTier(present.tier),
      actorRef: present.sub,
      requestId,
    });
    return json(
      marketBody(stored, {
        snapshotId: stored.id,
        persisted: true,
      }),
      201,
    );
  });
}
