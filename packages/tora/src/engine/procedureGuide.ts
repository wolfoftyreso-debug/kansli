/**
 * Var i processen den här upphandlingen befinner sig — och vad som väntar.
 *
 * Guiden i `domain/procedure.ts` beskriver förfarandet i allmänhet. Den här
 * motorn placerar *en bestämd upphandling* i den beskrivningen: vilket steg som
 * pågår, vilka som är passerade, och hur många dagar som återstår där det går
 * att räkna ut.
 *
 * Tre regler styr, och alla tre är samma regel som i resten av systemet.
 *
 * **Ett steg utan datum får ingen datering.** Saknas sista anbudsdag är svaret
 * "inte publicerad", inte ett uppskattat datum. En gissad deadline är värre än
 * ingen, eftersom den ser ut att gå att planera efter.
 *
 * **Läget härleds, det antas inte.** Vilket steg som pågår följer av
 * upphandlingens status och dess datum. Räcker inte de till markeras inget steg
 * som pågående — hellre en guide utan pekare än en pekare som pekar fel.
 *
 * **Avtalsspärren visas alltid.** Den är det enda steget som visas även långt
 * innan det blir aktuellt, av ett enda skäl: den som får veta om den först när
 * tilldelningsbeslutet kommer har redan förlorat dagar av ett fönster på tio.
 */

import type { IsoDate, Procurement } from "../domain/ontology";
import { PROCEDURE_GUIDES, type ProcedureGuide, type ProcedureStage } from "../domain/procedure";

export type StagePosition = "done" | "current" | "upcoming" | "unknown";

export interface WalkthroughStage {
  stage: ProcedureStage;
  position: StagePosition;
  /** Datumet steget infaller, när det går att härleda ur upphandlingen. */
  date?: IsoDate;
  /** Dagar kvar till `date`. Negativt betyder passerat. */
  daysUntil?: number;
  /** Varför steget saknar datum, när det gör det. */
  dateUnknownReason?: string;
}

export interface Walkthrough {
  guide: ProcedureGuide;
  stages: WalkthroughStage[];
  /** Sammanfattning av var man står, i klarspråk. */
  whereYouAre: string;
}

/**
 * Guiden utan upphandlingens egna datum.
 *
 * Kunskapen om förfarandet gatas aldrig; *när* stegen infaller är däremot
 * uppgifter om upphandlingen, och sista anbudsdag är en betald uppgift i
 * `OpportunityView.deadlineAt`.
 *
 * Funktionen ligger här, bredvid `Walkthrough`, och inte hos den ena
 * konsumenten. Den låg i `api.ts` och tjänsten byggde sin guide utan den — så
 * en gratisnivå fick sista anbudsdag genom `stages[].date` medan samma datum
 * var låst i `summary`. Redaktionen reser numera med det som ska redigeras, så
 * att en tredje konsument inte kan glömma den lika tyst.
 */
export function redactWalkthroughDates(walkthrough: Walkthrough, fullDetail: boolean): Walkthrough {
  if (fullDetail) return walkthrough;
  return {
    ...walkthrough,
    whereYouAre: walkthrough.whereYouAre.replace(/ Det löper ut [^.]+\./, ""),
    stages: walkthrough.stages.map((entry) => ({
      ...entry,
      date: undefined,
      daysUntil: undefined,
      dateUnknownReason: "Datum ingår i Pro och uppåt.",
    })),
  };
}

/** Heldagar mellan två ISO-datum. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

/**
 * Vilket steg upphandlingens status motsvarar.
 *
 * Kopplingen går via status och inte via datum där båda finns, eftersom status
 * är det köparen faktiskt sagt medan datum är vad vi räknat ut. Säger de emot
 * varandra vinner det köparen sagt.
 */
function currentStageId(procurement: Procurement, today: IsoDate): string | undefined {
  const { status, procedure, deadlineAt } = procurement;

  if (status === "awarded") return "contract";
  if (status === "under_review") return "standstill";
  if (status === "closed") return "examination";

  if (status === "predicted" || status === "planned") return undefined;
  if (status === "market_dialogue") return undefined;

  if (status === "announced") {
    if (procedure === "dynamic_purchasing_system") return "admission";
    if (procedure === "direct_award") return "contact";
    if (procedure === "framework_call_off") return "call_off";
    // Annonserad med en anbudsdag som passerat: anbuden är inne och prövas.
    if (deadlineAt && daysBetween(today, deadlineAt) < 0) return "examination";
    if (procedure === "selective" || procedure === "negotiated") return "application";
    return "tender_period";
  }

  return undefined;
}

/** Datumet för ett steg, när upphandlingen bär det. */
function dateFor(
  stage: ProcedureStage,
  procurement: Procurement,
): { date?: IsoDate; reason?: string } {
  switch (stage.id) {
    case "announcement":
      return procurement.announcedAt
        ? { date: procurement.announcedAt }
        : { reason: "Annonsdatum saknas i underlaget." };

    case "tender_period":
    case "application":
      return procurement.deadlineAt
        ? { date: procurement.deadlineAt }
        : { reason: "Sista anbudsdag är inte publicerad." };

    case "admission":
      return procurement.admissionOpenUntil
        ? { date: procurement.admissionOpenUntil }
        : { reason: "Systemets giltighetstid är inte publicerad." };

    case "contract":
    case "call_off_contract":
      return procurement.contractStart
        ? { date: procurement.contractStart }
        : { reason: "Avtalsstart är inte publicerad." };

    default:
      // Prövning, tilldelning och avtalsspärr saknar publicerade datum. Att
      // uppskatta dem ur anbudsdagen vore att uppfinna en tidplan köparen
      // aldrig lämnat — och den skulle se ut att gå att planera efter.
      return { reason: "Infaller efter anbudstiden; något datum är inte publicerat." };
  }
}

function positionOf(
  stage: ProcedureStage,
  index: number,
  currentIndex: number | undefined,
): StagePosition {
  if (currentIndex === undefined) return "unknown";
  if (index < currentIndex) return "done";
  if (index === currentIndex) return "current";
  return "upcoming";
}

/**
 * Bygger genomgången för en upphandling.
 *
 * `today` är explicit av samma skäl som i resten av motorerna: en bedömning som
 * beror på dagens datum måste gå att återskapa.
 */
export function buildWalkthrough(procurement: Procurement, today: IsoDate): Walkthrough {
  const guide = PROCEDURE_GUIDES[procurement.procedure];
  const currentId = currentStageId(procurement, today);
  const currentIndex = currentId ? guide.stages.findIndex((s) => s.id === currentId) : undefined;
  const resolvedCurrent =
    currentIndex !== undefined && currentIndex >= 0 ? currentIndex : undefined;

  const stages: WalkthroughStage[] = guide.stages.map((stage, index) => {
    const { date, reason } = dateFor(stage, procurement);
    return {
      stage,
      position: positionOf(stage, index, resolvedCurrent),
      date,
      daysUntil: date ? daysBetween(today, date) : undefined,
      dateUnknownReason: date ? undefined : reason,
    };
  });

  return { guide, stages, whereYouAre: describePosition(procurement, stages, resolvedCurrent) };
}

function describePosition(
  procurement: Procurement,
  stages: WalkthroughStage[],
  currentIndex: number | undefined,
): string {
  if (currentIndex === undefined) {
    return (
      "Var i processen den här upphandlingen står går inte att avgöra av det som är publicerat. " +
      "Stegen nedan visar hur förfarandet går till i sin helhet."
    );
  }

  const current = stages[currentIndex];
  const remaining = stages.length - currentIndex - 1;
  const tail =
    remaining > 0 ? ` Därefter återstår ${remaining} steg.` : " Det här är processens sista steg.";

  if (current.daysUntil !== undefined && current.daysUntil >= 0) {
    const days = current.daysUntil;
    const when = days === 0 ? "i dag" : days === 1 ? "om en dag" : `om ${days} dagar`;
    return `Pågående steg: ${current.stage.title}. Det löper ut ${when} (${current.date}).${tail}`;
  }

  if (procurement.status === "under_review") {
    return `Pågående steg: ${current.stage.title}. Upphandlingen är under överprövning.${tail}`;
  }

  return `Pågående steg: ${current.stage.title}.${tail}`;
}
