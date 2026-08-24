import {
  createLocalApi,
  demoCompany,
  demoGraph,
  DEMO_TODAY,
  type Company,
  type Tier,
} from "@pixdrift/tora";

const TIERS = new Set<Tier>(["free", "pro", "professional", "enterprise"]);

export function parseTier(value: string | null | undefined): Tier {
  if (value && TIERS.has(value as Tier)) return value as Tier;
  return "free";
}

const api = () => createLocalApi(demoGraph);

export function loadToraMarket(tier: Tier, company: Company = demoCompany) {
  return api().getMarket({
    company,
    tier,
    today: DEMO_TODAY,
  });
}

export function loadToraOpportunity(
  tier: Tier,
  opportunityId: string,
  company: Company = demoCompany,
) {
  return api().getOpportunity({
    company,
    tier,
    today: DEMO_TODAY,
    opportunityId,
  });
}

export function loadToraCalendar(tier: Tier, company: Company = demoCompany) {
  return api().getCalendar({
    company,
    tier,
    today: DEMO_TODAY,
  });
}
