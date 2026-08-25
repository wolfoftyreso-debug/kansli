import {
  createLocalApi,
  demoCompany,
  demoGraph,
  DEMO_TODAY,
  type Company,
  type Tier,
} from "@pixdrift/tora";

const TIERS = new Set<Tier>(["free", "pro", "professional", "enterprise"]);
const PAYING_ALIASES = new Set(["pilot", "paid", "full", "paying"]);

export function parseTier(value: string | null | undefined): Tier {
  if (value && TIERS.has(value as Tier)) return value as Tier;
  if (value && PAYING_ALIASES.has(value)) return "enterprise";
  return "free";
}

/**
 * The product surface is the paid product. The engine still redacts when a
 * caller asks for `free` directly.
 */
export function resolveViewTier(input: {
  sessionTier?: string | null;
  usingDemoCompany: boolean;
}): Tier {
  if (input.usingDemoCompany) return "enterprise";
  const parsed = parseTier(input.sessionTier);
  return parsed === "free" ? "enterprise" : parsed;
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
