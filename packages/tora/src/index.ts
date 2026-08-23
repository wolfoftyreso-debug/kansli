/**
 * @pixdrift/tora — TORA's opportunity engine.
 *
 * Public-procurement rights and recommended action. This is not RITA: RITA
 * verifies financial records against a rule set; TORA decides whether a
 * company may bid, on what legal basis, and what to do next.
 */

export { createLocalApi, type OpportunityApi, type ApiRequest, type MarketResponse } from "./engine/api";
export { buildOpportunities, type Opportunity } from "./engine/opportunity";
export { TIER_CAPABILITIES, type Tier } from "./engine/entitlement";
export { demoCompany, demoGraph, DEMO_TODAY } from "./data/seed";
