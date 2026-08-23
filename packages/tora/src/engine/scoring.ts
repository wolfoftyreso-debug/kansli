/**
 * Opportunity score.
 *
 * A number on its own is worthless here — a company deciding whether to spend a
 * week writing a bid needs to know *which* factor is carrying the score and
 * which one is the risk. So every factor is returned with its weight, its
 * value, and a sentence explaining it, and the headline number is reproducible
 * from that table by hand.
 *
 * Unknown factors are excluded from the average and reduce `confidence` instead.
 * Scoring an unknown as zero would quietly punish companies for questions we
 * never asked; scoring it as one would flatter them.
 */

import {
  areaCovers,
  daysBetween,
  expandCapabilities,
  type Area,
  type Capability,
  type Company,
  type IsoDate,
  type Procurement,
} from "../domain/ontology";
import type { AccessStatus } from "../domain/verdicts";
import type { QualificationResult } from "./eligibility";

export interface ScoreFactor {
  key: string;
  label: string;
  /** Relative importance. Weights need not sum to anything in particular. */
  weight: number;
  /** 0..1, or `undefined` when the underlying facts are missing. */
  value?: number;
  explanation: string;
}

export interface OpportunityScore {
  /** 0..100, computed across factors with known values only. */
  score: number;
  /** Share of total weight that was actually knowable, 0..1. */
  confidence: number;
  factors: ScoreFactor[];
  /** One paragraph a user can check the number against. */
  explanation: string;
}

export interface ScoringContext {
  areas: Area[];
  capabilities: Capability[];
  today: IsoDate;
  /**
   * How reachable the work is. Without this a perfect capability match inside a
   * framework the company cannot join scores 100/100 — a number that is true
   * about fit and useless as a decision.
   */
  access?: AccessStatus;
}

export function scoreOpportunity(
  procurement: Procurement,
  company: Company,
  qualification: QualificationResult,
  ctx: ScoringContext,
): OpportunityScore {
  const factors: ScoreFactor[] = [
    geographyFactor(procurement, company, ctx),
    serviceMatchFactor(procurement, company, ctx),
    requirementFactor(qualification),
    referenceFactor(qualification),
    sizeFactor(procurement, company),
    timingFactor(procurement, ctx),
    accessFactor(ctx.access),
  ];

  const known = factors.filter((f) => f.value !== undefined);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const knownWeight = known.reduce((sum, f) => sum + f.weight, 0);

  const score =
    knownWeight === 0
      ? 0
      : Math.round((known.reduce((sum, f) => sum + f.weight * (f.value as number), 0) / knownWeight) * 100);

  const confidence = totalWeight === 0 ? 0 : knownWeight / totalWeight;

  return { score, confidence, factors, explanation: explain(score, confidence, factors) };
}

/* ------------------------------------------------------------------ */
/* Factors                                                             */
/* ------------------------------------------------------------------ */

function geographyFactor(procurement: Procurement, company: Company, ctx: ScoringContext): ScoreFactor {
  const covered = areaCovers(ctx.areas, company.servesAreas, procurement.areas);
  return {
    key: "geography",
    label: "Geografi",
    weight: 20,
    value: covered ? 1 : 0.15,
    explanation: covered
      ? "Uppdragets område ligger inom företagets serviceområde."
      : "Uppdragets område ligger utanför företagets angivna serviceområde.",
  };
}

function serviceMatchFactor(procurement: Procurement, company: Company, ctx: ScoringContext): ScoreFactor {
  if (procurement.capabilities.length === 0) {
    return {
      key: "service",
      label: "Tjänstematch",
      weight: 25,
      explanation: "Upphandlingen saknar klassificerad tjänstekategori.",
    };
  }
  const own = expandCapabilities(ctx.capabilities, company.capabilities);
  const viaSub = expandCapabilities(ctx.capabilities, company.subcontractorCapabilities ?? []);

  const matched = procurement.capabilities.filter((c) => own.has(c)).length;
  const matchedViaSub = procurement.capabilities.filter((c) => !own.has(c) && viaSub.has(c)).length;

  // Subcontracted capability counts, but at a discount: it is a real route to
  // delivery and a real dependency at the same time.
  const value = (matched + matchedViaSub * 0.5) / procurement.capabilities.length;

  return {
    key: "service",
    label: "Tjänstematch",
    weight: 25,
    value,
    explanation:
      matchedViaSub > 0
        ? `${matched} av ${procurement.capabilities.length} tjänsteområden i egen regi, ${matchedViaSub} via underleverantör.`
        : `${matched} av ${procurement.capabilities.length} efterfrågade tjänsteområden matchar företagets kompetens.`,
  };
}

function requirementFactor(qualification: QualificationResult): ScoreFactor {
  const { met, remediable, unmet, unknown } = qualification.counts;
  const total = met + remediable + unmet + unknown;
  if (total === 0) {
    return {
      key: "requirements",
      label: "Kvalificeringskrav",
      weight: 25,
      // Faktorn saknar `value` med flit: den utesluts ur medelvärdet och sänker
      // konfidensen i stället för att räknas som noll eller ett. Men förklaringen
      // påstod tidigare *varför* listan var tom — "inte publicerade ännu" — och
      // det är en gissning som blir fel så snart en annonsering hämtas in utan
      // att någon läst dess underlag.
      explanation: qualification.extraction
        ? "Upphandlingen ställer inga obligatoriska kvalificeringskrav."
        : "Upphandlingens krav är inte inlästa och kan därför inte vägas in.",
    };
  }
  if (unknown === total) {
    return {
      key: "requirements",
      label: "Kvalificeringskrav",
      weight: 25,
      explanation: "Företagsprofilen saknar uppgifter för samtliga obligatoriska krav.",
    };
  }
  // A remediable gap is worth partial credit; an unmet one is worth none.
  const value = (met + remediable * 0.5) / (total - unknown);
  return {
    key: "requirements",
    label: "Kvalificeringskrav",
    weight: 25,
    value,
    explanation:
      `${met} av ${total} obligatoriska krav uppfylls` +
      (remediable > 0 ? `, ${remediable} kan åtgärdas` : "") +
      (unmet > 0 ? `, ${unmet} är inte uppfyllda` : "") +
      (unknown > 0 ? `, ${unknown} går inte att bedöma` : "") +
      ".",
  };
}

function referenceFactor(qualification: QualificationResult): ScoreFactor {
  const relevant = qualification.assessments.filter((a) => a.kind === "reference");

  if (relevant.length === 0) {
    return {
      key: "references",
      label: "Referenser",
      weight: 15,
      explanation: "Upphandlingen ställer inga redovisade referenskrav.",
    };
  }
  if (relevant.every((a) => a.status === "unknown")) {
    return {
      key: "references",
      label: "Referenser",
      weight: 15,
      explanation: "Referensuppdrag saknas i företagsprofilen.",
    };
  }
  const met = relevant.filter((a) => a.status === "met").length;
  return {
    key: "references",
    label: "Referenser",
    weight: 15,
    value: met / relevant.length,
    explanation: `${met} av ${relevant.length} referenskrav uppfylls med företagets angivna uppdrag.`,
  };
}

function sizeFactor(procurement: Procurement, company: Company): ScoreFactor {
  const { estimatedValueSek } = procurement;
  const revenue = company.annualRevenueSek;
  if (estimatedValueSek === undefined || revenue === undefined || revenue === 0) {
    return {
      key: "size",
      label: "Företagsstorlek",
      weight: 10,
      explanation:
        estimatedValueSek === undefined
          ? "Uppskattat kontraktsvärde är inte publicerat."
          : "Omsättning saknas i företagsprofilen.",
    };
  }
  const ratio = estimatedValueSek / revenue;
  // A contract far larger than annual revenue is a delivery and financing risk,
  // not a bigger opportunity.
  const value = ratio <= 0.5 ? 1 : ratio <= 1 ? 0.85 : ratio <= 2 ? 0.5 : 0.2;
  return {
    key: "size",
    label: "Företagsstorlek",
    weight: 10,
    value,
    explanation:
      `Uppskattat värde motsvarar ${ratio.toFixed(1)} gånger företagets årsomsättning` +
      (ratio > 1 ? " vilket ställer krav på kapacitet och likviditet." : "."),
  };
}

function timingFactor(procurement: Procurement, ctx: ScoringContext): ScoreFactor {
  if (!procurement.deadlineAt) {
    return {
      key: "timing",
      label: "Tidsmässig möjlighet",
      weight: 15,
      explanation: "Sista anbudsdag är inte publicerad.",
    };
  }
  const days = daysBetween(ctx.today, procurement.deadlineAt);
  if (days < 0) {
    return {
      key: "timing",
      label: "Tidsmässig möjlighet",
      weight: 15,
      value: 0,
      explanation: "Sista anbudsdag har passerat.",
    };
  }
  const value = days >= 30 ? 1 : days >= 14 ? 0.75 : days >= 7 ? 0.45 : 0.2;
  return {
    key: "timing",
    label: "Tidsmässig möjlighet",
    weight: 15,
    value,
    explanation:
      days >= 30
        ? `${days} dagar kvar till sista anbudsdag — gott om tid att förbereda anbudet.`
        : `${days} dagar kvar till sista anbudsdag — kort om tid.`,
  };
}

function accessFactor(access: AccessStatus | undefined): ScoreFactor {
  const label = "Åtkomlighet";
  const weight = 25;
  switch (access) {
    case undefined:
    case "unknown":
      return { key: "access", label, weight, explanation: "Förfarandet är inte fastställt." };
    case "granted":
      return { key: "access", label, weight, value: 1, explanation: "Gällande avtal ger tillgång till uppdraget." };
    case "open":
      return { key: "access", label, weight, value: 1, explanation: "Öppet för ansökan nu." };
    case "competitive":
      return {
        key: "access",
        label,
        weight,
        value: 0.8,
        explanation: "Uppdraget avgörs i konkurrens med andra anbudsgivare.",
      };
    case "discretionary":
      return {
        key: "access",
        label,
        weight,
        value: 0.55,
        explanation: "Vägen till uppdraget finns, men beslutet ligger hos den upphandlande organisationen.",
      };
    case "blocked":
      return {
        key: "access",
        label,
        weight,
        value: 0,
        explanation: "Uppdraget är inte åtkomligt — avtal, tilldelning eller passerad deadline stänger det.",
      };
  }
}

/* ------------------------------------------------------------------ */
/* Explanation                                                         */
/* ------------------------------------------------------------------ */

function explain(score: number, confidence: number, factors: ScoreFactor[]): string {
  const known = factors.filter((f) => f.value !== undefined) as Required<ScoreFactor>[];
  const unknown = factors.filter((f) => f.value === undefined);

  if (known.length === 0) {
    return "Det går inte att beräkna en poäng — samtliga faktorer saknar underlag.";
  }

  const sorted = [...known].sort((a, b) => b.value - a.value);
  const strengths = sorted.filter((f) => f.value >= 0.75).map((f) => f.label.toLowerCase());
  const weakest = sorted[sorted.length - 1];

  const parts: string[] = [];
  parts.push(
    strengths.length > 0
      ? `${score} av 100 eftersom du matchar ${listSv(strengths)}.`
      : `${score} av 100. Ingen enskild faktor är en tydlig styrka.`,
  );

  if (weakest.value < 0.75) {
    parts.push(`Störst osäkerhet: ${weakest.label.toLowerCase()} — ${lowerFirst(weakest.explanation)}`);
  }

  if (unknown.length > 0) {
    parts.push(
      `${unknown.length} av ${factors.length} faktorer kunde inte bedömas ` +
        `(${listSv(unknown.map((f) => f.label.toLowerCase()))}), så poängen bygger på ` +
        `${Math.round(confidence * 100)} % av underlaget.`,
    );
  }

  return parts.join(" ");
}

function listSv(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} och ${items[items.length - 1]}`;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
