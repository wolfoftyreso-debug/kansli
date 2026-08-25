/**
 * Procurement radar — the answer to "vad kan jag göra på den offentliga marknaden?"
 *
 * The radar is deliberately a summary of *shape*, not a list. A company that has
 * never sold to the public sector does not need 4 281 notices; it needs to learn
 * that eleven organizations near it buy what it does, and that three of them
 * have something open right now.
 */

import { indexBy, type Company, type ProcurementGraph } from "../domain/ontology";
import type { Verdict } from "../domain/verdicts";
import type { Opportunity, TimingBucket } from "./opportunity";

export interface RadarOrganization {
  id: string;
  name: string;
  kind: string;
  opportunityCount: number;
  /** Best score among this organization's opportunities. */
  bestScore: number;
}

export interface RadarCapabilityArea {
  code: string;
  label: string;
  opportunityCount: number;
}

export interface Radar {
  companyId: string;
  /**
   * Live opportunities only. Closed and awarded ones are counted separately —
   * folding them in would let the headline claim a market three times the size
   * of the one a company can actually act on.
   */
  totalRelevant: number;
  /** Awarded, cancelled or past deadline. Kept as history, not as opportunity. */
  totalHistorical: number;
  /** Actionable today. */
  openNow: Opportunity[];
  /** Expected to open within a year. */
  upcoming: Opportunity[];
  /** Further out, or without an established date. */
  watch: Opportunity[];
  closed: Opportunity[];
  organizations: RadarOrganization[];
  capabilityAreas: RadarCapabilityArea[];
  verdictCounts: Record<Verdict, number>;
  /** Total published value across relevant opportunities, where value is known. */
  knownValueSek: number;
  /** How many relevant opportunities published no value at all. */
  opportunitiesWithoutValue: number;
}

const EMPTY_VERDICT_COUNTS: Record<Verdict, number> = {
  RIGHT: 0,
  ELIGIBLE: 0,
  POSSIBLE: 0,
  COMPETITIVE: 0,
  NOT_ELIGIBLE: 0,
  UNKNOWN: 0,
};

export function buildRadar(
  company: Company,
  opportunities: Opportunity[],
  graph: ProcurementGraph,
): Radar {
  const byBucket = (bucket: TimingBucket) => opportunities.filter((o) => o.timing === bucket);

  const live = opportunities.filter((o) => o.timing !== "closed");

  // Counted over live opportunities only, to stay consistent with
  // `totalRelevant`. Counting history here would produce headlines like
  // "7 opportunities, 7 of which you cannot bid on".
  const verdictCounts = { ...EMPTY_VERDICT_COUNTS };
  live.forEach((o) => {
    verdictCounts[o.verdict] += 1;
  });

  const orgIndex = indexBy(graph.organizations, (o) => o.id);
  const orgMap = new Map<string, RadarOrganization>();
  opportunities.forEach((opportunity) => {
    const existing = orgMap.get(opportunity.organizationId);
    if (existing) {
      existing.opportunityCount += 1;
      existing.bestScore = Math.max(existing.bestScore, opportunity.score.score);
      return;
    }
    orgMap.set(opportunity.organizationId, {
      id: opportunity.organizationId,
      name: opportunity.organizationName,
      kind: orgIndex.get(opportunity.organizationId)?.kind ?? "unknown",
      opportunityCount: 1,
      bestScore: opportunity.score.score,
    });
  });

  const capabilityIndex = indexBy(graph.capabilities, (c) => c.code);
  const procurementIndex = indexBy(graph.procurements, (p) => p.id);
  const capabilityMap = new Map<string, RadarCapabilityArea>();
  opportunities.forEach((opportunity) => {
    const procurement = procurementIndex.get(opportunity.procurementId);
    const codes = procurement?.capabilities ?? [];
    codes.forEach((code) => {
      const existing = capabilityMap.get(code);
      if (existing) {
        existing.opportunityCount += 1;
        return;
      }
      capabilityMap.set(code, {
        code,
        label: capabilityIndex.get(code)?.label ?? code,
        opportunityCount: 1,
      });
    });
  });

  const withValue = live.filter((o) => o.estimatedValueSek !== undefined);

  return {
    companyId: company.id,
    totalRelevant: live.length,
    totalHistorical: opportunities.length - live.length,
    openNow: byBucket("open_now"),
    upcoming: byBucket("upcoming"),
    watch: byBucket("watch"),
    closed: byBucket("closed"),
    organizations: [...orgMap.values()].sort((a, b) => b.opportunityCount - a.opportunityCount),
    capabilityAreas: [...capabilityMap.values()].sort(
      (a, b) => b.opportunityCount - a.opportunityCount,
    ),
    verdictCounts,
    knownValueSek: withValue.reduce((sum, o) => sum + (o.estimatedValueSek ?? 0), 0),
    opportunitiesWithoutValue: live.length - withValue.length,
  };
}

/**
 * The one-line summary shown at the top of "Min offentliga marknad".
 *
 * It reports coverage honestly: a headline value that silently omits the
 * opportunities with no published value would overstate the market every time.
 */
export function radarHeadline(radar: Radar): string {
  const parts = [
    `${radar.totalRelevant} relevanta möjligheter`,
    `${radar.organizations.length} organisationer`,
    `${radar.openNow.length} öppna nu`,
    `${radar.upcoming.length} kommande`,
  ];
  if (radar.opportunitiesWithoutValue > 0) {
    parts.push(`${radar.opportunitiesWithoutValue} utan publicerat värde`);
  }
  if (radar.totalHistorical > 0) {
    parts.push(`${radar.totalHistorical} i historiken`);
  }
  return parts.join(" · ");
}
