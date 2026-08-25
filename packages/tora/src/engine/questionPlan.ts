/**
 * Frågorna som är värda att ställa — och varför de är det billigaste du kan
 * göra.
 *
 * Under anbudstiden har en leverantör ett enda verkligt sätt att påverka en
 * upphandling: att fråga. Det kostar ingenting, det tar en kvart, och det är
 * den enda åtgärden som kan rätta ett krav *innan* det är för sent. Alternativet
 * — överprövning — kostar visserligen heller ingen avgift, men förutsätter att
 * felet redan hunnit få verkan.
 *
 * Motorn räknar ingenting nytt. Den tar bedömningens luckor och de krav där
 * regeln beror på formuleringen, och gör om dem till konkreta frågor.
 *
 * Fyra gränser bär den, och den första är den som annars går fel överallt.
 *
 * **Sexdagarsfristen är inte din frågedeadline.** Den säger när köparen senast
 * ska ha *svarat*. När du senast får *fråga* står i underlaget och ligger nästan
 * alltid tidigare. Att presentera sexdagarsdatumet som "sista dag att fråga" är
 * att ge någon några dagars falsk marginal, så motorn kallar det vad det är: den
 * dag svaret senast ska finnas.
 *
 * **En fråga påstår aldrig att något är olagligt.** Motorn formulerar frågor om
 * hur ett krav ska förstås och hur det förhåller sig till uppdraget. Om ett krav
 * strider mot regelverket är en juridisk bedömning av ett underlag systemet inte
 * har läst, och ett anbud som inleds med en anklagelse hjälper ingen.
 *
 * **Svaret går till alla.** Det är inte en nackdel att nämna i förbigående utan
 * en förutsättning att förstå: du kan inte förhandla dig till något eget genom
 * att fråga, och du avslöjar inte heller något konkurrenterna ändå inte får veta.
 *
 * **Utan krav att fråga om föreslås inga frågor.** En lista med generiska frågor
 * gör att ingen läser den lista som betyder något.
 */

import type { StatutoryPeriod } from "../domain/procedure";
import { SUPPLEMENTARY_INFORMATION } from "../domain/procedure";
import type { IsoDate } from "../domain/ontology";
import type { CapacityPlan } from "./capacityPlan";
import type { RequirementAssessment } from "./eligibility";
import { daysBetween } from "./procedureGuide";

/* ------------------------------------------------------------------ */

/**
 * Vad frågan handlar om.
 *
 * `capacity` — går kravet att uppfylla med ett annat företags kapacitet?
 * `evidence` — vilket bevis godtas för kravet?
 * `proportionality` — hur förhåller sig kravet till uppdragets omfattning?
 */
export type QuestionKind = "capacity" | "evidence" | "proportionality";

export interface SuggestedQuestion {
  id: string;
  kind: QuestionKind;
  /** Kravet frågan gäller. */
  subject: string;
  /** Förslag på formulering. Ett utkast att skriva om, inte en mall att klistra. */
  draft: string;
  /** Varför den här frågan är värd att ställa. */
  why: string;
}

export type QuestionPlan =
  | {
      status: "ready";
      questions: SuggestedQuestion[];
      period: StatutoryPeriod;
      /**
       * Den dag svaret senast ska finnas — inte sista dag att fråga.
       * Utelämnas när sista anbudsdag saknas.
       */
      answersDueBy?: IsoDate;
      daysUntilAnswersDue?: number;
      summary: string;
    }
  | {
      status: "none";
      period: StatutoryPeriod;
      answersDueBy?: IsoDate;
      daysUntilAnswersDue?: number;
      summary: string;
    };

/* ------------------------------------------------------------------ */

function minusDays(date: IsoDate, days: number): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10) as IsoDate;
}

const GAP_STATUSES = new Set(["unmet", "remediable"]);

/* ------------------------------------------------------------------ */

export interface QuestionPlanInput {
  assessments: RequirementAssessment[];
  capacity: CapacityPlan;
  /** Sista anbudsdag. Saknas den räknas inget datum. */
  deadlineAt?: IsoDate;
  today: IsoDate;
}

/**
 * Frågeplanen utan upphandlingens datum.
 *
 * Frågorna själva står kvar på varje nivå — de är det billigaste sättet att
 * påverka en upphandling, och att ta betalt för dem vore att sälja tillbaka
 * något som redan är gratis. Dagen svaret senast ska finnas är däremot härledd
 * ur sista anbudsdag, som är en betald uppgift.
 */
export function redactQuestionDate(plan: QuestionPlan, fullDetail: boolean): QuestionPlan {
  if (fullDetail || plan.answersDueBy === undefined) return plan;
  return {
    ...plan,
    answersDueBy: undefined,
    daysUntilAnswersDue: undefined,
    summary:
      `${plan.summary} Datumet då svar senast ska finnas ingår i Pro och uppåt; regeln om ` +
      `${plan.period.days} dagar gäller ändå.`,
  };
}

export function buildQuestionPlan(input: QuestionPlanInput): QuestionPlan {
  const { assessments, capacity, deadlineAt, today } = input;
  const period = SUPPLEMENTARY_INFORMATION;

  const answersDueBy = deadlineAt ? minusDays(deadlineAt, period.days) : undefined;
  const daysUntilAnswersDue = answersDueBy ? daysBetween(today, answersDueBy) : undefined;

  const questions: SuggestedQuestion[] = [];
  const seen = new Set<string>();

  // Där regeln beror på formuleringen är en fråga det enda som avgör saken —
  // och den kostar ingenting jämfört med att gissa fel i ett anbud.
  for (const gap of capacity.unclear) {
    if (seen.has(gap.requirementId)) continue;
    seen.add(gap.requirementId);
    questions.push({
      id: `capacity:${gap.requirementId}`,
      kind: "capacity",
      subject: gap.label,
      draft:
        `Godtar ni att kravet "${gap.label}" uppfylls genom att anbudsgivaren åberopar ett annat ` +
        "företags kapacitet, och vilket åtagande krävs i så fall från det företaget?",
      why:
        "Om svaret är ja kan kravet lösas tillsammans med någon annan. Om det är nej är det bättre " +
        "att veta nu än efter att anbudsarbetet är gjort.",
    });
  }

  // För luckor som går att täcka är beviset ofta den verkliga frågan: vad
  // köparen godtar avgör om lösningen håller.
  for (const gap of capacity.bridgeable) {
    if (seen.has(gap.requirementId)) continue;
    seen.add(gap.requirementId);
    questions.push({
      id: `evidence:${gap.requirementId}`,
      kind: "evidence",
      subject: gap.label,
      draft:
        `Vilket underlag godtar ni som bevis för kravet "${gap.label}" när anbudsgivaren åberopar ` +
        "ett annat företags kapacitet?",
      why:
        "Vad som godtas som bevis avgör om lösningen håller. Ett åtagande i fel form kan göra att " +
        "kravet räknas som ouppfyllt fastän kapaciteten finns.",
    });
  }

  // Ett krav som ligger långt från vad uppdraget verkar kräva är värt en fråga
  // om proportionalitet. Frågan gäller hur kravet förhåller sig till uppdraget
  // — aldrig ett påstående om att det skulle strida mot något.
  for (const assessment of assessments) {
    if (!assessment.mandatory) continue;
    if (!GAP_STATUSES.has(assessment.status)) continue;
    const id = `proportionality:${assessment.requirementId}`;
    if (seen.has(assessment.requirementId) || seen.has(id)) continue;
    seen.add(id);
    questions.push({
      id,
      kind: "proportionality",
      subject: assessment.label,
      draft:
        `Kan ni beskriva hur kravet "${assessment.label}" förhåller sig till uppdragets omfattning ` +
        "och innehåll?",
      why:
        "En köpare som får frågan behöver motivera kravet, och det händer att ett krav då justeras " +
        "eller förtydligas. Frågan gäller hur kravet hänger ihop med uppdraget — den påstår inte " +
        "att något är fel.",
    });
  }

  const timing = (() => {
    if (answersDueBy === undefined) {
      return (
        "Sista anbudsdag saknas i underlaget vi har, så ingen dag räknas ut. Regeln gäller ändå: " +
        `svaret ska finnas senast ${period.days} dagar före sista anbudsdag.`
      );
    }
    const when =
      daysUntilAnswersDue !== undefined && daysUntilAnswersDue < 0
        ? `Den dagen (${answersDueBy}) har passerat.`
        : `Svaret ska finnas senast ${answersDueBy}.`;
    return (
      `${when} Det är inte samma sak som sista dag att fråga — när du senast får ställa frågan ` +
      "står i underlaget och ligger nästan alltid tidigare."
    );
  })();

  const limits =
    "Svaret går till samtliga anbudsgivare, så du kan inte fråga dig till något eget — och du " +
    "avslöjar inte heller något som de andra inte ändå får veta. Systemet formulerar frågor om " +
    "hur krav ska förstås. Huruvida ett krav är förenligt med regelverket är en juridisk " +
    "bedömning som kräver att någon läst hela underlaget.";

  if (questions.length === 0) {
    return {
      status: "none",
      period,
      answersDueBy,
      daysUntilAnswersDue,
      summary:
        "Bedömningen hittar inget krav som är värt en fråga. Möjligheten finns ändå, och den är " +
        `det billigaste sättet att påverka en upphandling. ${timing} ${limits}`,
    };
  }

  return {
    status: "ready",
    questions,
    period,
    answersDueBy,
    daysUntilAnswersDue,
    summary:
      `${questions.length} ${questions.length === 1 ? "fråga är värd" : "frågor är värda"} att ` +
      `ställa utifrån det bedömningen hittat. Att fråga kostar ingenting och tar en kvart. ` +
      `${timing} ${limits}`,
  };
}
