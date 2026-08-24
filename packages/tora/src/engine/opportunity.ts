/**
 * Opportunity engine — the join between a company and public demand.
 *
 * Everything upstream produces one half of an answer: the access engine knows
 * whether the door is open, the eligibility engine knows whether the company
 * fits through it, the lifecycle engine knows when the door appears. This module
 * assembles those into the object the product is actually about, and it is the
 * only place that decides what to recommend a company *do*.
 */

import {
  areaCovers,
  daysBetween,
  expandCapabilities,
  indexBy,
  type Company,
  type Contract,
  type IsoDate,
  type Procurement,
  type ProcurementGraph,
  type SourceRef,
} from "../domain/ontology";
import { unreviewedExtractionCaveat, type Caveat } from "../domain/regulations";
import {
  decideVerdict,
  VERDICT_SIGNAL,
  type LegalBasis,
  type Signal,
  type Verdict,
} from "../domain/verdicts";
import { assessProcurementAccess, type AccessContext, type AccessResult } from "./access";
import {
  assessQualification,
  type EligibilityContext,
  type QualificationResult,
} from "./eligibility";
import {
  predictedProcurement,
  predictNextProcurement,
  upcomingRenewals,
  type LifecyclePrediction,
} from "./lifecycle";
import { scoreOpportunity, type OpportunityScore } from "./scoring";

/** Where the opportunity sits in time — drives the radar buckets. */
export type TimingBucket = "open_now" | "upcoming" | "watch" | "closed";

export interface RecommendedAction {
  label: string;
  detail: string;
  effort: "low" | "medium" | "high";
  /** Lower sorts first. */
  priority: number;
  dueBy?: IsoDate;
}

export interface Opportunity {
  id: string;
  procurementId: string;
  organizationId: string;
  organizationName: string;
  title: string;
  verdict: Verdict;
  signal: Signal;
  /** One sentence: why this verdict. */
  rationale: string;
  legalBasis?: LegalBasis;
  access: AccessResult;
  qualification: QualificationResult;
  score: OpportunityScore;
  timing: TimingBucket;
  /** Days until the next date that matters, negative when it has passed. */
  daysUntilDeadline?: number;
  deadlineAt?: IsoDate;
  estimatedValueSek?: number;
  caveats: Caveat[];
  recommendedActions: RecommendedAction[];
  /** Present when this opportunity was derived from a contract expiry. */
  prediction?: LifecyclePrediction;
  sources: SourceRef[];
}

export interface OpportunityContext {
  graph: ProcurementGraph;
  today: IsoDate;
}

/* ------------------------------------------------------------------ */
/* Single opportunity                                                  */
/* ------------------------------------------------------------------ */

export function buildOpportunity(
  procurement: Procurement,
  company: Company,
  ctx: OpportunityContext,
  prediction?: LifecyclePrediction,
): Opportunity {
  const { graph, today } = ctx;
  const organization = indexBy(graph.organizations, (o) => o.id).get(procurement.organizationId);

  const eligibilityCtx: EligibilityContext = {
    areas: graph.areas,
    capabilities: graph.capabilities,
    certifications: graph.certifications,
    today,
  };
  const accessCtx: AccessContext = { graph, today };

  const qualification = assessQualification(
    procurement.requirements,
    company,
    eligibilityCtx,
    procurement.requirementsExtraction,
  );
  const access = assessProcurementAccess(procurement, company, accessCtx);

  const decision = decideVerdict({
    access: access.status,
    qualification: qualification.status,
    legalBasis: access.legalBasis,
    accessExplanation: access.explanation,
    qualificationExplanation: qualification.explanation,
  });

  const score = scoreOpportunity(procurement, company, qualification, {
    areas: graph.areas,
    capabilities: graph.capabilities,
    today,
    access: access.status,
  });

  const daysUntilDeadline = procurement.deadlineAt
    ? daysBetween(today, procurement.deadlineAt)
    : undefined;

  return {
    id: `opp:${company.id}:${procurement.id}`,
    procurementId: procurement.id,
    organizationId: procurement.organizationId,
    organizationName: organization?.name ?? "Okänd organisation",
    title: procurement.title,
    verdict: decision.verdict,
    signal: VERDICT_SIGNAL[decision.verdict],
    rationale: decision.rationale,
    legalBasis: decision.legalBasis,
    access,
    qualification,
    score,
    timing: timingBucket(procurement, prediction, today),
    daysUntilDeadline,
    deadlineAt: procurement.deadlineAt,
    estimatedValueSek: procurement.estimatedValueSek,
    caveats: dedupeCaveats([
      ...access.caveats,
      ...decision.caveats,
      ...qualificationCaveats(procurement),
    ]),
    recommendedActions: recommendActions(
      procurement,
      qualification,
      decision.verdict,
      prediction,
      today,
    ),
    prediction,
    sources: procurement.sources,
  };
}

function timingBucket(
  procurement: Procurement,
  prediction: LifecyclePrediction | undefined,
  today: IsoDate,
): TimingBucket {
  if (
    procurement.status === "awarded" ||
    procurement.status === "cancelled" ||
    procurement.status === "closed"
  ) {
    return "closed";
  }
  if (procurement.deadlineAt && procurement.deadlineAt < today) return "closed";
  if (procurement.status === "announced") return "open_now";
  if (procurement.procedure === "dynamic_purchasing_system") {
    const open = !procurement.admissionOpenUntil || procurement.admissionOpenUntil >= today;
    if (open) return "open_now";
  }
  if (prediction) {
    const daysToWindow = daysBetween(today, prediction.expectedAnnouncement.from);
    return daysToWindow <= 365 ? "upcoming" : "watch";
  }
  return "watch";
}

/**
 * What to actually do about this opportunity.
 *
 * Ordered by what blocks the company soonest, because the value of the whole
 * product is compressed into whether this list is right.
 */
function recommendActions(
  procurement: Procurement,
  qualification: QualificationResult,
  verdict: Verdict,
  prediction: LifecyclePrediction | undefined,
  today: IsoDate,
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  if (verdict === "NOT_ELIGIBLE") {
    const hard = qualification.blockers.find((b) => b.status === "unmet");
    if (hard) {
      actions.push({
        label: "Avstå denna upphandling",
        detail: `${hard.label}: ${hard.explanation}`,
        effort: "low",
        priority: 0,
      });
    }
    return actions;
  }

  // En rättighet är inte en åtgärdslista på noll rader.
  //
  // Avropsordningen säger vart köpet ska riktas, inte att det sker av sig
  // självt. Det som faktiskt avgör om företaget får uppdraget är att beställaren
  // känner till avtalet och att omfattningen ryms i det — och det är just den
  // sortens sak som ett blått kort utan nästa steg får någon att tro är avklarat.
  if (verdict === "RIGHT") {
    actions.push({
      label: "Stäm av avropet med beställaren",
      detail:
        "Avrop ska enligt avtalets avropsordning riktas hit. Bekräfta omfattning och tidplan, och " +
        "kontrollera att uppdraget ryms inom avtalets villkor.",
      effort: "low",
      priority: 1,
    });
  }

  // Missing profile data is the cheapest thing to fix and unblocks everything else.
  const unknowns = qualification.blockers.filter((b) => b.status === "unknown");
  if (unknowns.length > 0) {
    actions.push({
      label: `Komplettera företagsprofilen (${unknowns.length} ${unknowns.length === 1 ? "uppgift" : "uppgifter"})`,
      detail: `Systemet kan inte bedöma: ${unknowns.map((u) => u.label).join(", ")}.`,
      effort: "low",
      priority: 1,
    });
  }

  qualification.blockers
    .filter((b) => b.status === "remediable" && b.remediation)
    .sort((a, b) => effortRank(a.remediation!.effort) - effortRank(b.remediation!.effort))
    .forEach((blocker, index) => {
      actions.push({
        label: blocker.label,
        detail: blocker.remediation!.action,
        effort: blocker.remediation!.effort,
        priority: 2 + index,
        dueBy: procurement.deadlineAt,
      });
    });

  if (procurement.status === "announced" && procurement.deadlineAt) {
    const days = daysBetween(today, procurement.deadlineAt);
    if (days >= 0) {
      actions.push({
        label: "Lämna anbud",
        detail: `Sista anbudsdag ${procurement.deadlineAt} (${days} dagar kvar).`,
        effort: "high",
        priority: 10,
        dueBy: procurement.deadlineAt,
      });
    }
  }

  if (procurement.procedure === "dynamic_purchasing_system") {
    actions.push({
      label: "Ansök om att bli antagen",
      detail:
        "Ansökan kan lämnas löpande. Antagen leverantör får delta i alla avrop under systemets giltighetstid.",
      effort: "medium",
      priority: 3,
      dueBy: procurement.admissionOpenUntil,
    });
  }

  if (prediction) {
    actions.push({
      label: "Förbered inför kommande upphandling",
      detail:
        `Annonsering förväntas ${prediction.expectedAnnouncement.from} – ${prediction.expectedAnnouncement.to}. ` +
        "Använd tiden till att bygga referenser och säkra certifieringar.",
      effort: "medium",
      priority: 5,
      dueBy: prediction.expectedAnnouncement.from,
    });
    actions.push({
      label: "Bevaka marknadsdialog",
      detail:
        "Tidig dialog inför upphandlingen är tillåten och ger möjlighet att förstå behovet innan kraven är låsta.",
      effort: "low",
      priority: 6,
    });
  }

  return actions.sort((a, b) => a.priority - b.priority);
}

function effortRank(effort: "low" | "medium" | "high"): number {
  return effort === "low" ? 0 : effort === "medium" ? 1 : 2;
}

/**
 * Förbehåll som följer av *hur* kravlistan kom till, inte av vad den säger.
 *
 * Fristående från åtkomst och utfall, eftersom det gäller lika mycket för ett
 * `KVALIFICERAD` som för ett `EJ KVALIFICERAD` — en felläst lista kan utesluta
 * lika gärna som den kan släppa igenom.
 */
function qualificationCaveats(procurement: Procurement): Caveat[] {
  const extraction = procurement.requirementsExtraction;
  if (!extraction || extraction.method !== "automated" || extraction.reviewed === true) return [];
  return [unreviewedExtractionCaveat(extraction.source)];
}

function dedupeCaveats(caveats: Caveat[]): Caveat[] {
  const seen = new Set<string>();
  return caveats.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
}

/* ------------------------------------------------------------------ */
/* Whole-market build                                                  */
/* ------------------------------------------------------------------ */

/**
 * Whether a procurement is worth showing this company at all.
 *
 * Recall matters more than precision here — a missed opportunity is invisible to
 * the user, while an irrelevant one is one click to dismiss. So capability
 * overlap counts implied capabilities and subcontractor reach, and a shared CPV
 * code is enough on its own.
 */
export function isRelevant(
  procurement: Procurement,
  company: Company,
  graph: ProcurementGraph,
): boolean {
  const reach = expandCapabilities(graph.capabilities, [
    ...company.capabilities,
    ...(company.subcontractorCapabilities ?? []),
  ]);
  const capabilityOverlap = procurement.capabilities.some((c) => reach.has(c));
  const cpvOverlap = (company.cpvCodes ?? []).some((code) => procurement.cpvCodes.includes(code));
  if (!capabilityOverlap && !cpvOverlap) return false;

  // Geography does not exclude — a company may well want to know about work just
  // outside its stated area — but it must at least be in the same region.
  return (
    areaCovers(graph.areas, company.servesAreas, procurement.areas) ||
    sameRegion(procurement, company, graph)
  );
}

function sameRegion(procurement: Procurement, company: Company, graph: ProcurementGraph): boolean {
  const byCode = indexBy(graph.areas, (a) => a.code);
  const regionOf = (code: string) => byCode.get(code)?.parent ?? code;
  const companyRegions = new Set(company.servesAreas.map(regionOf));
  return procurement.areas.some((code) => companyRegions.has(regionOf(code)));
}

/**
 * Builds every opportunity for a company: announced notices, live contract
 * situations, and predicted re-procurements derived from expiring contracts.
 */
export function buildOpportunities(company: Company, ctx: OpportunityContext): Opportunity[] {
  const { graph, today } = ctx;

  const announced = graph.procurements
    .filter((p) => isRelevant(p, company, graph))
    .map((p) => buildOpportunity(p, company, ctx));

  // A contract with a successor notice already published is not a prediction any
  // more; showing both would double-count the same future work.
  const alreadySucceeded = new Set(
    graph.procurements
      .map((p) => p.predecessorContractId)
      .filter((id): id is string => Boolean(id)),
  );

  const predicted = upcomingRenewals(graph, today)
    .filter((prediction) => !alreadySucceeded.has(prediction.contractId))
    .map((prediction) => {
      const contract = graph.contracts.find((c) => c.id === prediction.contractId) as Contract;
      return { prediction, procurement: predictedProcurement(prediction, contract) };
    })
    .filter(({ procurement }) => isRelevant(procurement, company, graph))
    .map(({ procurement, prediction }) => buildOpportunity(procurement, company, ctx, prediction));

  return [...announced, ...predicted].sort(compareOpportunities);
}

/**
 * Sort order for listings: what is actionable and imminent first, then by score.
 * Closed items sink but are not removed — knowing you missed something is
 * information too.
 */
export function compareOpportunities(a: Opportunity, b: Opportunity): number {
  const bucketRank: Record<TimingBucket, number> = {
    open_now: 0,
    upcoming: 1,
    watch: 2,
    closed: 3,
  };
  const byBucket = bucketRank[a.timing] - bucketRank[b.timing];
  if (byBucket !== 0) return byBucket;

  if (
    a.timing === "open_now" &&
    a.daysUntilDeadline !== undefined &&
    b.daysUntilDeadline !== undefined
  ) {
    const byDeadline = a.daysUntilDeadline - b.daysUntilDeadline;
    if (byDeadline !== 0) return byDeadline;
  }
  return b.score.score - a.score.score;
}

/** Convenience for a single contract the caller already has in hand. */
export function opportunityFromContract(
  contract: Contract,
  company: Company,
  ctx: OpportunityContext,
): Opportunity {
  const prediction = predictNextProcurement(contract, ctx.graph, ctx.today);
  return buildOpportunity(predictedProcurement(prediction, contract), company, ctx, prediction);
}
