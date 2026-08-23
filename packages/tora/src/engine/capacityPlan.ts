/**
 * Vilka av dina luckor som går att täcka med någon annans kapacitet.
 *
 * Motorn räknar ingenting nytt. Den korsar bedömningen med reglerna i
 * `capacity.ts` och svarar på en fråga bedömningen inte ställer: *av det som
 * fattas, vad går att lösa tillsammans med någon annan, och vad måste du klara
 * själv?*
 *
 * Två gränser gör den användbar i stället för uppmuntrande.
 *
 * **Ett krav som inte går att låna sig till sägs vara det.** En plan som bara
 * listar möjligheter döljer att F-skatt och serviceområde är dina egna, och den
 * som upptäcker det sent har planerat runt ett hinder som inte fanns där hen
 * trodde.
 *
 * **Solidariskt ansvar nämns varje gång det kan bli aktuellt.** Att be någon om
 * ett åtagande för ekonomisk kapacitet kan innebära att be dem svara för hela
 * kontraktet. Den som frågar ska veta det innan de frågar, inte efter.
 */

import {
  type BridgeRule,
  bridgeRule,
  CAPACITY_JOINT_LIABILITY,
  CAPACITY_RELIANCE_ALLOWED,
  CAPACITY_VS_SUBCONTRACTOR,
  type CapacityRule,
} from "../domain/capacity";
import type { RequirementAssessment } from "./eligibility";

/* ------------------------------------------------------------------ */

export interface CapacityGap {
  requirementId: string;
  label: string;
  mandatory: boolean;
  rule: BridgeRule;
  /** Bedömningens egen förklaring, så luckan går att känna igen. */
  explanation: string;
}

export interface CapacityPlan {
  /** Luckor som går att täcka med annans kapacitet. */
  bridgeable: CapacityGap[];
  /** Luckor där det är oklart, och som är värda en fråga till köparen. */
  unclear: CapacityGap[];
  /** Luckor du måste klara själv. */
  yours: CapacityGap[];
  /** Sant när minst en lucka kan utlösa solidariskt ansvar. */
  jointLiabilityRelevant: boolean;
  rules: CapacityRule[];
  summary: string;
}

/* ------------------------------------------------------------------ */

/** Statusar som betyder att något faktiskt fattas. */
const GAP_STATUSES = new Set(["unmet", "remediable"]);

export function buildCapacityPlan(assessments: RequirementAssessment[]): CapacityPlan {
  const gaps: CapacityGap[] = assessments
    .filter((a) => GAP_STATUSES.has(a.status))
    .map((a) => ({
      requirementId: a.requirementId,
      label: a.label,
      mandatory: a.mandatory,
      rule: bridgeRule(a.kind),
      explanation: a.explanation,
    }));

  const bridgeable = gaps.filter((g) => g.rule.bridgeable === "yes");
  const unclear = gaps.filter((g) => g.rule.bridgeable === "unclear");
  const yours = gaps.filter((g) => g.rule.bridgeable === "no");
  const jointLiabilityRelevant = bridgeable.some((g) => g.rule.jointLiabilityPossible === true);

  const rules: CapacityRule[] = [CAPACITY_RELIANCE_ALLOWED, CAPACITY_VS_SUBCONTRACTOR];
  if (jointLiabilityRelevant) rules.push(CAPACITY_JOINT_LIABILITY);

  const parts: string[] = [];

  if (gaps.length === 0) {
    parts.push(
      "Bedömningen hittar inga krav som fattas. Regeln är ändå värd att känna till: ett krav du " +
        "inte klarar ensam behöver inte vara ett stopp.",
    );
  } else {
    if (bridgeable.length > 0) {
      parts.push(
        `${bridgeable.length} av ${gaps.length} luckor är av ett slag som går att täcka genom att ` +
          "åberopa ett annat företags kapacitet.",
      );
    }
    if (yours.length > 0) {
      parts.push(
        `${yours.length} måste du klara själv: ${yours.map((g) => g.label).join(", ")}. ` +
          "Ingen annans kapacitet träder i stället för dem.",
      );
    }
    if (unclear.length > 0) {
      parts.push(
        `För ${unclear.length} beror det på hur kravet är formulerat. Det är en bra fråga att ` +
          "ställa under frågeperioden — den kostar ingenting och svaret går till alla anbudsgivare.",
      );
    }
  }

  if (jointLiabilityRelevant) {
    parts.push(
      "Minst en lucka gäller ekonomisk kapacitet. Köparen får då kräva att företaget du åberopar " +
        "tar solidariskt ansvar för att kontraktet fullgörs — det är mer än en underskrift, och " +
        "den du frågar bör få veta det innan de svarar.",
    );
  }

  parts.push(
    "Vad som gäller i den här upphandlingen avgörs av dess upphandlingsdokument. Systemet säger " +
      "vad regeln tillåter, inte vad köparen har bestämt.",
  );

  return { bridgeable, unclear, yours, jointLiabilityRelevant, rules, summary: parts.join(" ") };
}
