import { createLocalApi, demoCompany, demoGraph, DEMO_TODAY, type Tier } from "@pixdrift/tora";

const TIERS = new Set<Tier>(["free", "pro", "professional", "enterprise"]);

export function parseTier(value: string | null | undefined): Tier {
  if (value && TIERS.has(value as Tier)) return value as Tier;
  return "free";
}

export function loadToraMarket(tier: Tier) {
  return createLocalApi(demoGraph).getMarket({
    company: demoCompany,
    tier,
    today: DEMO_TODAY,
  });
}
