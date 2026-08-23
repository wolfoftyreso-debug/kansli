import { createLocalApi, demoCompany, demoGraph, DEMO_TODAY, type Tier } from "@pixdrift/tora";

const TIERS = new Set<Tier>(["free", "pro", "professional", "enterprise"]);

export function parseTier(value: string | null | undefined): Tier {
  if (value && TIERS.has(value as Tier)) return value as Tier;
  return "free";
}

const api = () => createLocalApi(demoGraph);

export function loadToraMarket(tier: Tier) {
  return api().getMarket({
    company: demoCompany,
    tier,
    today: DEMO_TODAY,
  });
}

export function loadToraOpportunity(tier: Tier, opportunityId: string) {
  return api().getOpportunity({
    company: demoCompany,
    tier,
    today: DEMO_TODAY,
    opportunityId,
  });
}

export function loadToraCalendar(tier: Tier) {
  return api().getCalendar({
    company: demoCompany,
    tier,
    today: DEMO_TODAY,
  });
}
