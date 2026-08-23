/**
 * Freemium gating.
 *
 * Two decisions are worth stating plainly, because they are product decisions
 * and not implementation details:
 *
 *  1. Gating happens here, on the data, not in the UI. A locked field is
 *     replaced by a teaser before it reaches a component, so a paid value never
 *     sits in the DOM waiting to be read out of devtools.
 *
 *  2. Legal caveats are never locked. The doctrine that says a company has no
 *     entitlement to a job, or that a direct award is the buyer's decision, is
 *     the thing standing between a user and a costly misunderstanding. Charging
 *     for it would make the free tier actively misleading, which is worse than
 *     having no free tier.
 *
 * NOTE: this module runs client-side and is therefore a presentation contract,
 * not a security boundary. The same tier check has to be enforced in the API
 * before locked fields are ever serialised to a free-tier client. Treating this
 * file as the enforcement point would ship a paywall that a fetch call walks
 * straight through.
 */

import type { IsoDate, SourceRef } from "../domain/ontology";
import type { Caveat } from "../domain/regulations";
import type { LegalBasis, Signal, Verdict } from "../domain/verdicts";
import type { CalendarEntry, CalendarEntryKind } from "./calendar";
import type { QualificationResult } from "./eligibility";
import type { LifecyclePrediction } from "./lifecycle";
import type { Opportunity, RecommendedAction, TimingBucket } from "./opportunity";
import type { OpportunityScore } from "./scoring";

export type Tier = "free" | "pro" | "professional" | "enterprise";

export const TIER_LABEL: Record<Tier, string> = {
  free: "Gratis",
  pro: "Pro",
  professional: "Professional",
  enterprise: "Enterprise",
};

/**
 * A gated field. The discriminant is a string rather than a boolean because this
 * project compiles with `strict: false`, where boolean-literal discriminants do
 * not narrow reliably — and a union that fails to narrow is how a locked value
 * ends up rendered by accident.
 */
export type Locked<T> = { state: "locked"; teaser: string } | { state: "unlocked"; value: T };

export function unlocked<T>(value: T): Locked<T> {
  return { state: "unlocked", value };
}

export function locked<T>(teaser: string): Locked<T> {
  return { state: "locked", teaser };
}

export function isLocked<T>(field: Locked<T>): boolean {
  return field.state === "locked";
}

/** What each tier may see. Ordered least to most capable. */
export interface TierCapabilities {
  /** Identify the buyer and the specific procurement. */
  identifyOpportunity: boolean;
  /** Dates, values, requirement detail, sources. */
  fullDetail: boolean;
  /** Historical award ranges and competitor picture. */
  priceIntelligence: boolean;
  /** The bid workflow. */
  bidWorkflow: boolean;
  /** SMS alerts rather than email only. */
  smsAlerts: boolean;
  /** Maximum number of opportunities returned in full. */
  maxDetailedOpportunities: number;
}

export const TIER_CAPABILITIES: Record<Tier, TierCapabilities> = {
  free: {
    identifyOpportunity: false,
    fullDetail: false,
    priceIntelligence: false,
    bidWorkflow: false,
    smsAlerts: false,
    maxDetailedOpportunities: 0,
  },
  pro: {
    identifyOpportunity: true,
    fullDetail: true,
    priceIntelligence: true,
    bidWorkflow: false,
    smsAlerts: true,
    maxDetailedOpportunities: Number.POSITIVE_INFINITY,
  },
  professional: {
    identifyOpportunity: true,
    fullDetail: true,
    priceIntelligence: true,
    bidWorkflow: true,
    smsAlerts: true,
    maxDetailedOpportunities: Number.POSITIVE_INFINITY,
  },
  enterprise: {
    identifyOpportunity: true,
    fullDetail: true,
    priceIntelligence: true,
    bidWorkflow: true,
    smsAlerts: true,
    maxDetailedOpportunities: Number.POSITIVE_INFINITY,
  },
};

export interface OpportunityView {
  id: string;
  /* Always visible — this is the teaser that makes the free tier worth using. */
  verdict: Verdict;
  signal: Signal;
  timing: TimingBucket;
  /** Coarse band, e.g. "80–89", so a free user sees relevance without the number. */
  scoreBand: string;
  /** Legal guardrails, never gated. */
  caveats: Caveat[];
  /** Buyer type ("kommun", "region") without naming the buyer. */
  organizationKindHint: string;

  /* Gated. */
  organizationName: Locked<string>;
  title: Locked<string>;
  rationale: Locked<string>;
  accessExplanation: Locked<string>;
  legalBasis: Locked<LegalBasis | undefined>;
  score: Locked<OpportunityScore>;
  deadlineAt: Locked<IsoDate | undefined>;
  daysUntilDeadline: Locked<number | undefined>;
  estimatedValueSek: Locked<number | undefined>;
  qualification: Locked<QualificationResult>;
  recommendedActions: Locked<RecommendedAction[]>;
  prediction: Locked<LifecyclePrediction | undefined>;
  sources: Locked<SourceRef[]>;
}

export function scoreBand(score: number): string {
  // The top band runs 90–100 rather than 100–109, which a naive decade split
  // produces for a perfect score.
  const floor = Math.min(Math.floor(score / 10) * 10, 90);
  return `${floor}–${floor === 90 ? 100 : floor + 9}`;
}

export function redactOpportunity(
  opportunity: Opportunity,
  tier: Tier,
  organizationKindHint = "offentlig organisation",
): OpportunityView {
  const caps = TIER_CAPABILITIES[tier];

  const identify = <T>(value: T, teaser: string): Locked<T> =>
    caps.identifyOpportunity ? unlocked(value) : locked(teaser);
  const detail = <T>(value: T, teaser: string): Locked<T> =>
    caps.fullDetail ? unlocked(value) : locked(teaser);

  return {
    id: opportunity.id,
    verdict: opportunity.verdict,
    signal: opportunity.signal,
    timing: opportunity.timing,
    scoreBand: scoreBand(opportunity.score.score),
    caveats: opportunity.caveats,
    organizationKindHint,

    organizationName: identify(opportunity.organizationName, "Lås upp för att se vilken organisation."),
    title: identify(opportunity.title, "Lås upp för att se vilken upphandling."),
    rationale: detail(opportunity.rationale, "Lås upp för att se varför systemet matchat möjligheten."),
    accessExplanation: detail(opportunity.access.explanation, "Lås upp för den procedurmässiga bedömningen."),
    legalBasis: detail(opportunity.legalBasis, "Lås upp för den rättsliga grunden."),
    score: detail(opportunity.score, "Lås upp för exakt poäng och faktorunderlag."),
    deadlineAt: detail(opportunity.deadlineAt, "Lås upp för sista anbudsdag."),
    daysUntilDeadline: detail(opportunity.daysUntilDeadline, "Lås upp för tid kvar."),
    estimatedValueSek: detail(opportunity.estimatedValueSek, "Lås upp för beräknat värde."),
    qualification: detail(opportunity.qualification, "Lås upp för fullständig kravanalys."),
    recommendedActions: detail(opportunity.recommendedActions, "Lås upp för rekommenderade åtgärder."),
    prediction: detail(opportunity.prediction, "Lås upp för tidplan och prognosunderlag."),
    sources: detail(opportunity.sources, "Lås upp för källor och dokument."),
  };
}

export function redactOpportunities(
  opportunities: Opportunity[],
  tier: Tier,
  organizationKindHints: Map<string, string> = new Map(),
): OpportunityView[] {
  return opportunities.map((o) =>
    redactOpportunity(o, tier, organizationKindHints.get(o.organizationId) ?? "offentlig organisation"),
  );
}

/**
 * Calendar entries need the same treatment as opportunity cards. The free tier
 * keeps the calendar's *shape* — when something happens and what kind of event
 * it is — because that is a real taste of the product. It does not keep the
 * buyer, the procurement or the link, which is the part being sold.
 */
export interface CalendarEntryView {
  date: string;
  kind: CalendarEntryKind;
  predicted: boolean;
  daysAway: number;
  identified: boolean;
  /** Empty when not identified. */
  organizationName: string;
  title: string;
  detail: string;
  /** Only set when identified, so a redacted entry cannot deep-link. */
  opportunityId?: string;
}

export function redactCalendarEntry(entry: CalendarEntry, tier: Tier): CalendarEntryView {
  const identified = TIER_CAPABILITIES[tier].identifyOpportunity;
  if (identified) {
    return {
      date: entry.date,
      kind: entry.kind,
      predicted: entry.predicted,
      daysAway: entry.daysAway,
      identified: true,
      organizationName: entry.organizationName,
      title: entry.title,
      detail: entry.detail,
      opportunityId: entry.opportunityId,
    };
  }
  return {
    date: entry.date,
    kind: entry.kind,
    predicted: entry.predicted,
    daysAway: entry.daysAway,
    identified: false,
    organizationName: "",
    title: "",
    detail: "Lås upp för att se vilken organisation och upphandling det gäller.",
  };
}

/** Narrow helper so components can read a locked field without repeating the guard. */
export function valueOr<T>(field: Locked<T>, fallback: T): T {
  return field.state === "locked" ? fallback : field.value;
}
