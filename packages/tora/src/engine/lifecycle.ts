/**
 * Procurement lifecycle.
 *
 * This is the part an ordinary tender feed cannot do. A published notice is
 * already late for a five-person firm — by then the references it lacks cannot
 * be built. What matters is the sentence "this contract expires in eight months
 * and this buyer has re-procured every four years, so start now."
 *
 * Everything here is a *prediction*, and it is labelled as one. Predictions
 * carry the reasoning that produced them and a confidence that drops when the
 * inputs are thin, rather than a single confident date that would be wrong.
 */

import {
  addMonths,
  areaCovers,
  daysBetween,
  indexBy,
  type Contract,
  type IsoDate,
  type Procurement,
  type ProcurementGraph,
} from "../domain/ontology";

/** Used when a buyer has no observable announcement-to-start history. */
export const DEFAULT_LEAD_TIME_DAYS = 150;

/**
 * Evidence floors.
 *
 * `priceIntelligence` refuses to publish a range below a sample floor. This
 * engine used to publish "procured on roughly a 48-month rhythm" from a single
 * observed interval, and a lead-time median from a single observation — the most
 * differentiating feature in the product resting on the weakest evidence in it.
 *
 * Claiming a *pattern* takes more than one observation, so below these floors
 * the prediction still uses what was observed (throwing information away would
 * be worse) but marks it weak, says so in the basis, and takes a confidence hit.
 */
export const MIN_INTERVALS_FOR_RHYTHM = 2;
export const MIN_OBSERVATIONS_FOR_LEAD_TIME = 3;

export interface RenewalRhythm {
  medianMonths: number;
  /** Number of observed gaps between successive contracts, i.e. contracts − 1. */
  intervals: number;
  /** Whether the sample reaches `MIN_INTERVALS_FOR_RHYTHM`. */
  sufficient: boolean;
}

export interface LeadTimeObservation {
  medianDays: number;
  observations: number;
  /** Whether the sample reaches `MIN_OBSERVATIONS_FOR_LEAD_TIME`. */
  sufficient: boolean;
}

export interface LifecyclePrediction {
  contractId: string;
  organizationId: string;
  title: string;
  /**
   * When the contract actually ends. A range, because an undecided extension
   * option is genuine uncertainty and collapsing it to one date invents
   * precision the data does not have.
   */
  effectiveEnd: { earliest: IsoDate; latest: IsoDate };
  /** The window in which a new notice would be expected. */
  expectedAnnouncement: { from: IsoDate; to: IsoDate };
  /** 0..1. Driven by how much of the reasoning rests on observation. */
  confidence: number;
  /** Each step of the reasoning, shown to the user verbatim. */
  basis: string[];
  /** Observed procurement rhythm, absent when no interval could be observed at all. */
  renewalRhythm?: RenewalRhythm;
  /** Observed announcement lead time, absent when the buyer has no history. */
  leadTime?: LeadTimeObservation;
  /** The lead time actually used in the calculation. */
  leadTimeDays: number;
  /** `observed_weak` means real observations below the evidence floor. */
  leadTimeSource: "observed" | "observed_weak" | "default";
}

/**
 * Earliest and latest the contract can run to, given its options.
 * Exercised options extend it for certain; undecided ones extend the upper
 * bound only; declined ones are ignored.
 */
export function effectiveEndRange(contract: Contract): { earliest: IsoDate; latest: IsoDate } {
  const certain = contract.options
    .filter((o) => o.exercised === true)
    .reduce((sum, o) => sum + o.extensionMonths, 0);
  const undecided = contract.options
    .filter((o) => o.exercised === undefined)
    .reduce((sum, o) => sum + o.extensionMonths, 0);

  return {
    earliest: addMonths(contract.endDate, certain),
    latest: addMonths(contract.endDate, certain + undecided),
  };
}

/** Median months between the starts of this buyer's successive contracts for the same need. */
export function observedRenewalRhythm(
  contract: Contract,
  graph: ProcurementGraph,
): RenewalRhythm | undefined {
  // Raw intersection: successive contracts for the same need name the same
  // capabilities. Expanding here would fold unrelated contracts into the series
  // and invent a renewal rhythm that never existed.
  const wanted = new Set(contract.capabilities);
  const siblings = graph.contracts
    .filter((c) => c.organizationId === contract.organizationId)
    .filter((c) => c.capabilities.some((code) => wanted.has(code)))
    .filter((c) => areaCovers(graph.areas, c.areas, contract.areas))
    .map((c) => c.startDate)
    .sort();

  if (siblings.length < 2) return undefined;

  const intervals: number[] = [];
  for (let i = 1; i < siblings.length; i += 1) {
    intervals.push(daysBetween(siblings[i - 1], siblings[i]) / 30.44);
  }
  return {
    medianMonths: Math.round(median(intervals)),
    intervals: intervals.length,
    sufficient: intervals.length >= MIN_INTERVALS_FOR_RHYTHM,
  };
}

/** Median days from announcement to contract start, observed for this buyer. */
export function observedLeadTime(
  organizationId: string,
  graph: ProcurementGraph,
): LeadTimeObservation | undefined {
  const observations = graph.procurements
    .filter((p) => p.organizationId === organizationId)
    .filter((p): p is Procurement & { announcedAt: IsoDate; contractStart: IsoDate } =>
      Boolean(p.announcedAt && p.contractStart),
    )
    .map((p) => daysBetween(p.announcedAt, p.contractStart))
    .filter((d) => d > 0);

  if (observations.length === 0) return undefined;
  return {
    medianDays: Math.round(median(observations)),
    observations: observations.length,
    sufficient: observations.length >= MIN_OBSERVATIONS_FOR_LEAD_TIME,
  };
}

export function predictNextProcurement(
  contract: Contract,
  graph: ProcurementGraph,
  today: IsoDate,
): LifecyclePrediction {
  const effectiveEnd = effectiveEndRange(contract);
  const leadTime = observedLeadTime(contract.organizationId, graph);
  const rhythm = observedRenewalRhythm(contract, graph);
  // Use what was observed even below the floor — discarding it for a generic
  // default would be less accurate, not more honest. The weakness is reported.
  const leadTimeDays = leadTime?.medianDays ?? DEFAULT_LEAD_TIME_DAYS;

  const from = addDays(effectiveEnd.earliest, -leadTimeDays);
  const to = addDays(effectiveEnd.latest, -Math.round(leadTimeDays * 0.5));

  const organization = indexBy(graph.organizations, (o) => o.id).get(contract.organizationId);
  const buyerName = organization?.name ?? "Organisationen";

  const basis: string[] = [`${buyerName} har avtalet ${contract.title} till ${contract.endDate}.`];

  const undecided = contract.options.filter((o) => o.exercised === undefined);
  if (undecided.length > 0) {
    const months = undecided.reduce((sum, o) => sum + o.extensionMonths, 0);
    basis.push(
      `Avtalet har ${undecided.length} outnyttjad förlängningsoption om totalt ${months} månader. ` +
        `Om samtliga utnyttjas löper avtalet till ${effectiveEnd.latest}.`,
    );
  } else if (contract.options.length > 0) {
    basis.push("Samtliga förlängningsoptioner är avgjorda.");
  }

  if (!leadTime) {
    basis.push(
      `Ingen observerad annonseringstid för ${buyerName}. Antar ${DEFAULT_LEAD_TIME_DAYS} dagar som schablon.`,
    );
  } else if (leadTime.sufficient) {
    basis.push(
      `Historiskt har ${buyerName} annonserat i snitt ${leadTime.medianDays} dagar före avtalsstart ` +
        `(${leadTime.observations} observationer).`,
    );
  } else {
    basis.push(
      `Endast ${plural(leadTime.observations, "observation", "observationer")} av annonseringstid för ` +
        `${buyerName} (median ${leadTime.medianDays} dagar). För få för att fastställa ett mönster — ` +
        "värdet används men prognosen är osäkrare.",
    );
  }

  if (rhythm?.sufficient) {
    basis.push(
      `Tjänsten har upphandlats med cirka ${rhythm.medianMonths} månaders intervall ` +
        `(${rhythm.intervals} observerade intervall).`,
    );
  } else if (rhythm) {
    basis.push(
      `Endast ${plural(rhythm.intervals, "observerat intervall", "observerade intervall")} ` +
        `(${rhythm.medianMonths} månader). För få för att fastställa en upphandlingsrytm.`,
    );
  }

  // Confidence is built from what was actually observed, and weak evidence earns
  // materially less than sufficient evidence.
  let confidence = 0.35;
  if (leadTime?.sufficient) confidence += 0.25;
  else if (leadTime) confidence += 0.1;
  if (rhythm?.sufficient) confidence += 0.2;
  else if (rhythm) confidence += 0.05;
  if (undecided.length === 0) confidence += 0.15;
  else confidence -= 0.1 * Math.min(undecided.length, 2);
  if (daysBetween(today, effectiveEnd.earliest) > 365 * 3) confidence -= 0.15;
  // Capped below 1 on purpose: a prediction should never present as near-certain.
  confidence = clamp(confidence, 0.05, 0.9);

  return {
    contractId: contract.id,
    organizationId: contract.organizationId,
    title: contract.title,
    effectiveEnd,
    expectedAnnouncement: { from, to },
    confidence,
    basis,
    renewalRhythm: rhythm,
    leadTime,
    leadTimeDays,
    leadTimeSource: !leadTime ? "default" : leadTime.sufficient ? "observed" : "observed_weak",
  };
}

function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/**
 * Turns a prediction into a `predicted` procurement so it can flow through the
 * same pipeline as real notices. It deliberately carries no requirements: the
 * buyer has not written them yet, and inheriting the previous procurement's
 * requirements would let the engines assess a company against rules that do not
 * exist. Downstream this resolves to `UNKNOWN`, which is the honest answer.
 */
export function predictedProcurement(
  prediction: LifecyclePrediction,
  contract: Contract,
): Procurement {
  return {
    id: `pred:${contract.id}`,
    organizationId: contract.organizationId,
    title: `${contract.title} — förväntad ny upphandling`,
    description:
      `Prognos baserad på att nuvarande avtal löper ut ${prediction.effectiveEnd.earliest}. ` +
      "Upphandlingen är inte annonserad och kraven är inte publicerade.",
    cpvCodes: contract.cpvCodes,
    capabilities: contract.capabilities,
    areas: contract.areas,
    regulation: "LOU",
    procedure: "open",
    status: "predicted",
    estimatedValueSek: contract.valueSek,
    contractStart: prediction.effectiveEnd.earliest,
    requirements: [],
    predecessorContractId: contract.id,
    sources: contract.sources,
  };
}

/** Every contract in the graph whose successor is worth watching. */
export function upcomingRenewals(
  graph: ProcurementGraph,
  today: IsoDate,
  horizonDays = 365 * 2,
): LifecyclePrediction[] {
  return graph.contracts
    .map((contract) => predictNextProcurement(contract, graph, today))
    .filter((p) => {
      const days = daysBetween(today, p.expectedAnnouncement.to);
      return days >= 0 && days <= horizonDays;
    })
    .sort((a, b) => a.expectedAnnouncement.from.localeCompare(b.expectedAnnouncement.from));
}

/* ------------------------------------------------------------------ */

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function addDays(date: IsoDate, days: number): IsoDate {
  const ms = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
