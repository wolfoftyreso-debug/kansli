import { randomUUID } from "node:crypto";
import type pg from "pg";
import type { EventLog } from "@pixdrift/events";
import { demoCompany } from "@pixdrift/tora";
import { loadToraMarket, parseTier } from "./market";

export interface MarketSnapshot {
  id: string;
  orgRef: string;
  companyName: string;
  tier: string;
  openNow: number;
  upcoming: number;
  organizationCount: number;
  knownValueSek: number;
  headline: string;
  evaluatedAt: string;
}

export function evaluateMarket(tier: string) {
  const parsed = parseTier(tier);
  const market = loadToraMarket(parsed);
  return { market, company: demoCompany.name, tier: parsed };
}

export async function persistSnapshot(input: {
  pool: pg.Pool;
  events: EventLog;
  orgRef: string;
  tier: string;
  actorRef?: string | null;
  requestId: string;
}) {
  const { market, company, tier } = evaluateMarket(input.tier);
  const id = randomUUID();
  await input.pool.query(
    `insert into tora.market_snapshots
       (id, org_ref, company_name, tier, open_now, upcoming, organization_count, known_value_sek, headline)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      id,
      input.orgRef,
      company,
      tier,
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
  return { id, market, company, tier };
}

export async function listSnapshots(pool: pg.Pool, orgRef: string): Promise<MarketSnapshot[]> {
  const { rows } = await pool.query(
    `select id, org_ref, company_name, tier, open_now, upcoming, organization_count,
            known_value_sek, headline, evaluated_at
       from tora.market_snapshots
      where org_ref = $1
      order by evaluated_at desc
      limit 20`,
    [orgRef],
  );
  return rows.map((row) => ({
    id: row.id as string,
    orgRef: row.org_ref as string,
    companyName: row.company_name as string,
    tier: row.tier as string,
    openNow: Number(row.open_now),
    upcoming: Number(row.upcoming),
    organizationCount: Number(row.organization_count),
    knownValueSek: Number(row.known_value_sek),
    headline: row.headline as string,
    evaluatedAt: new Date(row.evaluated_at as Date).toISOString(),
  }));
}
