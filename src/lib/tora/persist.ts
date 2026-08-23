import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { demoCompany } from "@pixdrift/tora";
import { loadToraMarket, parseTier } from "./market";

export async function evaluateAndStore(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  tier: string;
  actorRef?: string | null;
  requestId: string;
}) {
  const market = loadToraMarket(parseTier(input.tier));
  const id = randomUUID();
  await input.pool.query(
    `insert into tora.market_snapshots
       (id, org_ref, company_name, tier, open_now, upcoming, organization_count, known_value_sek, headline)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      input.orgRef,
      demoCompany.name,
      input.tier,
      market.summary.openNowCount,
      market.summary.upcomingCount,
      market.summary.organizationCount,
      market.summary.knownValueSek,
      market.summary.headline,
    ],
  );
  await input.events.publish({
    system: "tora",
    kind: "tora.market.evaluated",
    orgRef: input.orgRef,
    actorKind: input.actorRef ? "user" : "system",
    actorRef: input.actorRef ?? null,
    subjectRef: `tora:snapshot:${id}`,
    requestId: input.requestId,
    payload: {
      openNow: market.summary.openNowCount,
      upcoming: market.summary.upcomingCount,
      knownValueSek: market.summary.knownValueSek,
      headline: market.summary.headline,
    },
  });
  return { id, market, company: demoCompany.name };
}
