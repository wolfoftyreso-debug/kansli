/**
 * Price and competition intelligence.
 *
 * A five-person firm cannot realistically assemble what a hundred past awards
 * say about a market. Doing that assembly is genuinely valuable — and it is also
 * the part of this product that could most easily be misused.
 *
 * Two constraints are therefore built into the types, not left to the UI:
 *
 *  1. There is no field anywhere in this module for a recommended, suggested, or
 *     target price. The engine reports what was *observed* in published awards
 *     and nothing else. You cannot ask it what to bid.
 *  2. Every result carries the competition-compliance notice. Historical public
 *     data is lawful to analyse; using it to coordinate with competitors is not.
 */

import {
  areaCovers,
  expandCapabilities,
  indexBy,
  type AreaCode,
  type CapabilityCode,
  type IsoDate,
  type ProcurementGraph,
} from "../domain/ontology";
import { DOCTRINE, type Caveat, doctrineCaveat } from "../domain/regulations";

/**
 * Below this, the sample is too small to describe a market — and small samples
 * are exactly where a published "range" starts to identify individual bids.
 */
export const MIN_AWARDS_FOR_RANGE = 3;
export const MIN_SUPPLIERS_FOR_RANGE = 2;

export interface ObservedRange {
  count: number;
  distinctSuppliers: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface CompetitorSnapshot {
  supplierName: string;
  wins: number;
  /** Most recent award date for this supplier within the scope. */
  lastWonAt: IsoDate;
  totalValueSek?: number;
}

export type PriceIntelligence =
  | {
      status: "insufficient_data";
      /** What was found, so the user can see why nothing is shown. */
      awardsFound: number;
      distinctSuppliers: number;
      reason: string;
      compliance: string;
      caveats: Caveat[];
    }
  | {
      status: "ok";
      /** Observed contract values from published award decisions. */
      awardValues: ObservedRange;
      /** Observed number of bids received, where published. */
      bidCounts?: ObservedRange;
      competitors: CompetitorSnapshot[];
      /** Share of awards in scope that published no value at all. */
      valueCoverage: number;
      compliance: string;
      caveats: Caveat[];
    };

export interface PriceScope {
  capabilities: CapabilityCode[];
  areas: AreaCode[];
  organizationId?: string;
  /** Ignore awards older than this. */
  since?: IsoDate;
}

export function analysePrices(scope: PriceScope, graph: ProcurementGraph): PriceIntelligence {
  const procurementIndex = indexBy(graph.procurements, (p) => p.id);
  const wanted = expandCapabilities(graph.capabilities, scope.capabilities);
  const caveats = [doctrineCaveat("noPriceCoordination")];

  const inScope = graph.awards.filter((award) => {
    const procurement = procurementIndex.get(award.procurementId);
    if (!procurement) return false;
    if (scope.organizationId && procurement.organizationId !== scope.organizationId) return false;
    if (scope.since && award.awardedAt < scope.since) return false;
    // The query scope is expanded (asking about elservice should reach implied
    // work); the procurement's own classification is taken at face value.
    if (!procurement.capabilities.some((c) => wanted.has(c))) return false;
    // The queried area is the container: asking about "Stockholms län" must
    // reach an award made in Tyresö, not the other way round.
    return areaCovers(graph.areas, scope.areas, procurement.areas);
  });

  const distinctSuppliers = new Set(inScope.map((a) => a.supplierName)).size;

  if (inScope.length < MIN_AWARDS_FOR_RANGE || distinctSuppliers < MIN_SUPPLIERS_FOR_RANGE) {
    return {
      status: "insufficient_data",
      awardsFound: inScope.length,
      distinctSuppliers,
      reason:
        `Underlaget omfattar ${plural(inScope.length, "tilldelning", "tilldelningar")} från ` +
        `${plural(distinctSuppliers, "leverantör", "leverantörer")}. ` +
        `Minst ${MIN_AWARDS_FOR_RANGE} tilldelningar från ${MIN_SUPPLIERS_FOR_RANGE} leverantörer krävs ` +
        "innan ett intervall redovisas.",
      compliance: DOCTRINE.noPriceCoordination,
      caveats,
    };
  }

  const values = inScope.map((a) => a.valueSek).filter((v): v is number => v !== undefined);
  const bidCounts = inScope.map((a) => a.bidCount).filter((v): v is number => v !== undefined);

  if (values.length < MIN_AWARDS_FOR_RANGE) {
    return {
      status: "insufficient_data",
      awardsFound: inScope.length,
      distinctSuppliers,
      reason:
        `${plural(inScope.length, "tilldelning", "tilldelningar")} hittades men bara ${values.length} ` +
        "har publicerat värde. Ett intervall skulle bygga på för få observationer.",
      compliance: DOCTRINE.noPriceCoordination,
      caveats,
    };
  }

  const competitorMap = new Map<string, CompetitorSnapshot>();
  inScope.forEach((award) => {
    const existing = competitorMap.get(award.supplierName);
    if (existing) {
      existing.wins += 1;
      existing.lastWonAt = award.awardedAt > existing.lastWonAt ? award.awardedAt : existing.lastWonAt;
      if (award.valueSek !== undefined) {
        existing.totalValueSek = (existing.totalValueSek ?? 0) + award.valueSek;
      }
      return;
    }
    competitorMap.set(award.supplierName, {
      supplierName: award.supplierName,
      wins: 1,
      lastWonAt: award.awardedAt,
      totalValueSek: award.valueSek,
    });
  });

  return {
    status: "ok",
    awardValues: describe(values, distinctSuppliers),
    bidCounts: bidCounts.length >= MIN_AWARDS_FOR_RANGE ? describe(bidCounts, distinctSuppliers) : undefined,
    competitors: [...competitorMap.values()].sort((a, b) => b.wins - a.wins),
    valueCoverage: values.length / inScope.length,
    compliance: DOCTRINE.noPriceCoordination,
    caveats,
  };
}

/**
 * A sentence a user can read without misreading it as advice. Note the framing:
 * what the market *has accepted*, never what they *should* bid.
 */
export function describePriceIntelligence(result: PriceIntelligence): string {
  if (result.status === "insufficient_data") return result.reason;
  const { awardValues, valueCoverage } = result;
  return (
    `Historiskt har tilldelade värden legat mellan ${fmt(awardValues.min)} och ${fmt(awardValues.max)}, ` +
    `med ${fmt(awardValues.median)} som median över ` +
    `${plural(awardValues.count, "tilldelning", "tilldelningar")} från ` +
    `${plural(awardValues.distinctSuppliers, "leverantör", "leverantörer")}. ` +
    (valueCoverage < 1
      ? `${Math.round((1 - valueCoverage) * 100)} % av tilldelningarna i urvalet saknar publicerat värde.`
      : "Samtliga tilldelningar i urvalet har publicerat värde.")
  );
}

function describe(values: number[], distinctSuppliers: number): ObservedRange {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    distinctSuppliers,
    min: sorted[0],
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1],
  };
}

function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function fmt(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
