/**
 * Eligibility engine — does this company meet the stated requirements?
 *
 * One principle governs the whole file: a fact the company never supplied
 * produces `unknown`, not `unmet`. Telling a small firm it fails a requirement
 * we simply never asked about is the failure mode that would make this product
 * worse than useless.
 *
 * To distinguish "skipped the question" from "answered no", the profile's list
 * fields are read as tri-state: an empty list means *not stated*, a non-empty
 * list means the company enumerated what it has and anything absent is absent.
 */

import {
  areaCovers,
  areaLineage,
  daysBetween,
  expandCapabilities,
  indexBy,
  type Area,
  type Capability,
  type Certification,
  type Company,
  type IsoDate,
  type Requirement,
  type RequirementKind,
  type RequirementsExtraction,
  type SourceRef,
} from "../domain/ontology";
import type { QualificationStatus } from "../domain/verdicts";

export type RequirementStatus = "met" | "unmet" | "remediable" | "unknown";

/**
 * How far a capacity gap can credibly be bridged by relying on another entity's
 * resources.
 *
 * Doing so is legally available, so a naive engine marks every shortfall
 * "remediable" — and then tells a five-person firm with 8 MSEK in revenue that a
 * 62 MSEK hospital contract requiring 25 staff is within reach after "an
 * action". That is flattery, and it costs the user a wasted week. Beyond this
 * multiple the engine says the requirement is unmet and explains why.
 */
export const CAPACITY_RELIANCE_MAX_MULTIPLE = 3;

export interface Remediation {
  /** What the company would actually have to do, phrased as an instruction. */
  action: string;
  effort: "low" | "medium" | "high";
  typicalLeadTimeDays?: number;
}

export interface RequirementAssessment {
  requirementId: string;
  /** Carried through so consumers can group by kind without parsing labels. */
  kind: RequirementKind;
  label: string;
  mandatory: boolean;
  status: RequirementStatus;
  /** Why the engine landed on this status, in the user's language. */
  explanation: string;
  remediation?: Remediation;
  source: SourceRef;
}

export interface EligibilityContext {
  areas: Area[];
  capabilities: Capability[];
  certifications: Certification[];
  /** Evaluation date; passed in so results are reproducible in tests. */
  today: IsoDate;
}

/* ------------------------------------------------------------------ */
/* Per-requirement assessment                                          */
/* ------------------------------------------------------------------ */

export function assessRequirement(
  requirement: Requirement,
  company: Company,
  ctx: EligibilityContext,
): RequirementAssessment {
  const base = {
    requirementId: requirement.id,
    kind: requirement.kind,
    label: requirement.label,
    mandatory: requirement.mandatory,
    source: requirement.source,
  };

  switch (requirement.kind) {
    case "revenue": {
      if (company.annualRevenueSek === undefined) {
        return { ...base, status: "unknown", explanation: "Omsättning saknas i företagsprofilen." };
      }
      const required = requirement.minAnnualRevenueSek;
      if (company.annualRevenueSek >= required) {
        return {
          ...base,
          status: "met",
          explanation: `Omsättning ${formatSek(company.annualRevenueSek)} täcker kravet på ${formatSek(required)}.`,
        };
      }
      // A supplier may rely on another entity's economic capacity, so a modest
      // shortfall is a gap with a named remedy rather than a closed door. A very
      // large one is not.
      if (required / company.annualRevenueSek > CAPACITY_RELIANCE_MAX_MULTIPLE) {
        return beyondCapacityReach(base, company, {
          gap:
            `Omsättningskravet ${formatSek(required)} är mer än ${CAPACITY_RELIANCE_MAX_MULTIPLE} gånger ` +
            `företagets omsättning ${formatSek(company.annualRevenueSek)}.`,
          remedy: "Redovisa åtagandet från det företag vars ekonomiska kapacitet ni åberopar.",
        });
      }
      return {
        ...base,
        status: "remediable",
        explanation: `Omsättning ${formatSek(company.annualRevenueSek)} understiger kravet på ${formatSek(required)}.`,
        remediation: {
          action:
            "Åberopa ett annat företags ekonomiska kapacitet, t.ex. moderbolag eller samarbetspartner. " +
            "Kräver ett åtagande från det företaget.",
          effort: "high",
        },
      };
    }

    case "employees": {
      if (company.employees === undefined) {
        return {
          ...base,
          status: "unknown",
          explanation: "Antal anställda saknas i företagsprofilen.",
        };
      }
      if (company.employees >= requirement.minEmployees) {
        return {
          ...base,
          status: "met",
          explanation: `${company.employees} anställda möter kravet på minst ${requirement.minEmployees}.`,
        };
      }
      if (
        company.employees === 0 ||
        requirement.minEmployees / company.employees > CAPACITY_RELIANCE_MAX_MULTIPLE
      ) {
        return beyondCapacityReach(base, company, {
          gap:
            `Kravet på ${requirement.minEmployees} anställda är mer än ${CAPACITY_RELIANCE_MAX_MULTIPLE} ` +
            `gånger företagets ${company.employees}.`,
          remedy: "Redovisa den partner eller underleverantör vars kapacitet ni åberopar.",
        });
      }
      return {
        ...base,
        status: "remediable",
        explanation: `${company.employees} anställda understiger kravet på minst ${requirement.minEmployees}.`,
        remediation: {
          action: "Åberopa underleverantörs kapacitet eller lämna anbud i grupp.",
          effort: "medium",
        },
      };
    }

    case "certification": {
      if (company.certifications.length === 0) {
        return {
          ...base,
          status: "unknown",
          explanation: "Certifieringar är inte angivna i profilen.",
        };
      }
      if (company.certifications.includes(requirement.certification)) {
        const label = certificationLabel(ctx, requirement.certification);
        return { ...base, status: "met", explanation: `Företaget har ${label}.` };
      }
      const cert = indexBy(ctx.certifications, (c) => c.code).get(requirement.certification);
      return {
        ...base,
        status: "remediable",
        explanation: `Företaget saknar ${certificationLabel(ctx, requirement.certification)}.`,
        remediation: {
          action: cert?.issuer
            ? `Ansök om ${cert.label} hos ${cert.issuer}.`
            : `Skaffa ${certificationLabel(ctx, requirement.certification)}, alternativt anlita underleverantör som har den.`,
          effort: (cert?.typicalLeadTimeDays ?? 0) > 90 ? "high" : "medium",
          typicalLeadTimeDays: cert?.typicalLeadTimeDays,
        },
      };
    }

    case "reference": {
      if (company.references.length === 0) {
        return {
          ...base,
          status: "unknown",
          explanation: "Referensuppdrag är inte angivna i profilen.",
        };
      }
      const matching = company.references.filter((ref) => {
        if (requirement.capability) {
          const covered = expandCapabilities(ctx.capabilities, ref.capabilities);
          if (!covered.has(requirement.capability)) return false;
        }
        if (requirement.minValueSek !== undefined) {
          if (ref.valueSek === undefined || ref.valueSek < requirement.minValueSek) return false;
        }
        if (requirement.mustBePublicCustomer && !ref.customerIsPublic) return false;
        if (ref.completedAt === undefined) return false;
        const ageDays = daysBetween(ref.completedAt, ctx.today);
        return ageDays >= 0 && ageDays <= requirement.withinYears * 365;
      });

      if (matching.length >= requirement.count) {
        return {
          ...base,
          status: "met",
          explanation: `${matching.length} av ${requirement.count} begärda referensuppdrag matchar kravet.`,
        };
      }
      const missing = requirement.count - matching.length;
      return {
        ...base,
        status: "remediable",
        explanation:
          `${matching.length} av ${requirement.count} begärda referensuppdrag matchar. ` +
          `Saknar ${missing}.`,
        remediation: {
          action:
            missing === requirement.count
              ? "Bygg referenser genom mindre uppdrag, eller åberopa underleverantörs referenser."
              : `Komplettera med ${missing} referensuppdrag inom ${requirement.withinYears} år.`,
          effort: "high",
        },
      };
    }

    case "geography": {
      if (areaCovers(ctx.areas, company.servesAreas, requirement.areas)) {
        return {
          ...base,
          status: "met",
          explanation: "Företagets serviceområde täcker uppdragets område.",
        };
      }
      // Same county is a plausible expansion; further away is treated as unmet
      // rather than dressed up as an easy fix.
      const sameCounty = requirement.areas.some((required) =>
        areaLineage(ctx.areas, required).some((ancestor) =>
          company.servesAreas.some((served) => areaLineage(ctx.areas, served).includes(ancestor)),
        ),
      );
      if (!sameCounty) {
        return {
          ...base,
          status: "unmet",
          explanation: "Uppdragets område ligger utanför företagets angivna region.",
        };
      }
      return {
        ...base,
        status: "remediable",
        explanation:
          "Uppdragets område ligger utanför angivet serviceområde men inom samma region.",
        remediation: {
          action: "Utöka serviceområdet i profilen, eller säkra lokal underleverantör.",
          effort: "medium",
        },
      };
    }

    case "insurance": {
      const cover = company.insurance?.liabilityCoverSek;
      if (cover === undefined) {
        return { ...base, status: "unknown", explanation: "Försäkringsbelopp saknas i profilen." };
      }
      if (cover >= requirement.minLiabilityCoverSek) {
        return {
          ...base,
          status: "met",
          explanation: `Ansvarsförsäkring ${formatSek(cover)} möter kravet på ${formatSek(requirement.minLiabilityCoverSek)}.`,
        };
      }
      return {
        ...base,
        status: "remediable",
        explanation: `Ansvarsförsäkring ${formatSek(cover)} understiger kravet på ${formatSek(requirement.minLiabilityCoverSek)}.`,
        remediation: {
          action: "Höj försäkringsbeloppet hos ditt försäkringsbolag.",
          effort: "low",
        },
      };
    }

    case "registration": {
      if (company.registrations.length === 0) {
        return {
          ...base,
          status: "unknown",
          explanation: "Registreringar är inte angivna i profilen.",
        };
      }
      const registration = registrationLabel(requirement.registration);
      if (company.registrations.includes(requirement.registration)) {
        return { ...base, status: "met", explanation: `Företaget är ${registration}.` };
      }
      return {
        ...base,
        status: "remediable",
        explanation: `Företaget är inte ${registration}.`,
        remediation: { action: "Registrera hos Skatteverket och bifoga intyg.", effort: "low" },
      };
    }

    case "capability": {
      const own = expandCapabilities(ctx.capabilities, company.capabilities);
      if (own.has(requirement.capability)) {
        return {
          ...base,
          status: "met",
          explanation: `Företaget utför ${capabilityLabel(ctx, requirement.capability)}.`,
        };
      }
      const viaSub = expandCapabilities(ctx.capabilities, company.subcontractorCapabilities ?? []);
      if (viaSub.has(requirement.capability)) {
        return {
          ...base,
          status: "remediable",
          explanation: `Kompetensen finns hos underleverantör, inte i egen regi.`,
          remediation: {
            action: "Redovisa underleverantören och bifoga åtagande.",
            effort: "medium",
          },
        };
      }
      return {
        ...base,
        status: "unmet",
        explanation: `Företaget utför inte ${capabilityLabel(ctx, requirement.capability)}.`,
      };
    }

    case "document": {
      // Paperwork is always closable; the value here is the checklist, not a verdict.
      return {
        ...base,
        status: "remediable",
        explanation: `${requirement.documentType} ska bifogas anbudet.`,
        remediation: { action: `Ta fram ${requirement.documentType}.`, effort: "low" },
      };
    }

    case "other": {
      // Free-text requirements are not machine-decidable. Saying so is the
      // correct output; inventing a status here is exactly what the product
      // rule forbids.
      return {
        ...base,
        status: "unknown",
        explanation: `Kräver manuell bedömning: ${requirement.description}`,
      };
    }
  }
}

/**
 * Ett kapacitetsgap större än vad inlånad kapacitet rimligen överbryggar.
 *
 * Utfallet beror på om företaget faktiskt tillfrågats. Att svara `unmet` när
 * frågan aldrig ställts vore att påstå att ingen kapacitetsutfästelse finns —
 * och det är inte något profilen säger. Backtestet fångade motorn i just det:
 * en firma som vunnit på en partners ekonomiska kapacitet fick beskedet att den
 * inte kunde delta.
 */
function beyondCapacityReach(
  base: Omit<RequirementAssessment, "status" | "explanation">,
  company: Company,
  texts: { gap: string; remedy: string },
): RequirementAssessment {
  if (company.canRelyOnExternalCapacity === true) {
    return {
      ...base,
      status: "remediable",
      explanation: `${texts.gap} Företaget har angett att annan aktörs kapacitet kan åberopas.`,
      remediation: { action: texts.remedy, effort: "high" },
    };
  }

  if (company.canRelyOnExternalCapacity === undefined) {
    return {
      ...base,
      status: "unknown",
      explanation:
        `${texts.gap} Kravet kan ändå uppfyllas genom att åberopa annan aktörs kapacitet, ` +
        "men profilen svarar inte på om det är möjligt.",
    };
  }

  return {
    ...base,
    status: "unmet",
    explanation:
      `${texts.gap} Företaget har angett att ingen extern kapacitet kan åberopas, ` +
      "så gapet går inte att överbrygga.",
  };
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

export interface QualificationResult {
  status: QualificationStatus;
  assessments: RequirementAssessment[];
  /** Mandatory requirements only — what actually decides participation. */
  counts: { met: number; remediable: number; unmet: number; unknown: number };
  /** Ordered worst-first, so the UI can lead with what blocks the company. */
  blockers: RequirementAssessment[];
  /**
   * Underlaget för kravlistan. Saknas det är listan inte känt fullständig och
   * `status` har begränsats därefter.
   */
  extraction?: RequirementsExtraction;
  /** Satt när något annat än kraven själva avgjorde `status`. */
  explanation?: string;
}

/**
 * Kraven för en upphandling ingen har läst.
 *
 * Utan `extraction` är kravlistan inte känt fullständig, och två av de fyra
 * utfallen är då påståenden vi inte kan bära:
 *
 *   `qualified`  — "inget hindrar företaget". Ett oläst krav hindrar.
 *   `remediable` — "efter dessa åtgärder kan företaget delta". Samma sak.
 *
 * De två övriga överlever, och det är ingen slump. `failed` vilar på ett
 * bestämt obligatoriskt krav som företaget bevisligen inte uppfyller — fler
 * krav kan bara lägga till uteslutningar, aldrig ta bort den som redan finns.
 * `unknown` är redan det svar som saknad kunskap ska ge.
 *
 * Det som *inte* händer är att bedömningarna göms. `assessments` och `blockers`
 * är oförändrade: de gap vi har hittat är verkliga och visas. Det enda som
 * dämpas är rubriken, som annars läses som ett besked.
 */
function capForIncompleteRequirements(status: QualificationStatus): QualificationStatus {
  return status === "qualified" || status === "remediable" ? "unknown" : status;
}

export function assessQualification(
  requirements: Requirement[],
  company: Company,
  ctx: EligibilityContext,
  extraction?: RequirementsExtraction,
): QualificationResult {
  const assessments = requirements.map((r) => assessRequirement(r, company, ctx));
  const mandatory = assessments.filter((a) => a.mandatory);

  const counts = {
    met: mandatory.filter((a) => a.status === "met").length,
    remediable: mandatory.filter((a) => a.status === "remediable").length,
    unmet: mandatory.filter((a) => a.status === "unmet").length,
    unknown: mandatory.filter((a) => a.status === "unknown").length,
  };

  // Precedence: a hard failure outranks missing facts, and missing facts outrank
  // a fixable gap. Reporting "remediable" while something is genuinely unknown
  // would be a quiet promise the data does not support.
  const fromRequirements: QualificationStatus =
    counts.unmet > 0
      ? "failed"
      : counts.unknown > 0
        ? "unknown"
        : counts.remediable > 0
          ? "remediable"
          : "qualified";

  const status = extraction ? fromRequirements : capForIncompleteRequirements(fromRequirements);

  const rank: Record<RequirementStatus, number> = { unmet: 0, unknown: 1, remediable: 2, met: 3 };
  const blockers = mandatory
    .filter((a) => a.status !== "met")
    .sort((a, b) => rank[a.status] - rank[b.status]);

  return {
    status,
    assessments,
    counts,
    blockers,
    extraction,
    explanation:
      status === fromRequirements
        ? undefined
        : requirements.length === 0
          ? "Upphandlingens kvalificeringskrav är inte inlästa, så det går inte att avgöra om " +
            "företaget uppfyller dem. Att inga krav är registrerade betyder inte att inga ställs."
          : `Kravlistan är inte känt fullständig — ${requirements.length} krav är registrerade men ` +
            "underlaget är inte inläst. De gap som visas är verkliga; att inga fler finns är inte belagt.",
  };
}

/* ------------------------------------------------------------------ */
/* Formatting helpers                                                  */
/* ------------------------------------------------------------------ */

export function formatSek(value: number): string {
  return `${value.toLocaleString("sv-SE")} kr`;
}

function capabilityLabel(ctx: EligibilityContext, code: string): string {
  return indexBy(ctx.capabilities, (c) => c.code).get(code)?.label ?? code;
}

function certificationLabel(ctx: EligibilityContext, code: string): string {
  return indexBy(ctx.certifications, (c) => c.code).get(code)?.label ?? code;
}

/** Registration codes are internal identifiers; users read Swedish. */
const REGISTRATION_LABELS: Record<string, string> = {
  f_tax: "registrerat för F-skatt",
  vat: "momsregistrerat",
  employer: "registrerat som arbetsgivare",
};

function registrationLabel(code: string): string {
  return REGISTRATION_LABELS[code] ?? `registrerat för ${code}`;
}
