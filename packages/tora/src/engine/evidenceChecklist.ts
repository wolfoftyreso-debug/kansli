/**
 * Vad du behöver skicka in — och när du senast måste börja hämta det.
 *
 * Bedömningen säger om företaget klarar kraven. Den säger inte vad man ska
 * *göra*, och avståndet mellan de två är där veckan går förlorad. Den här
 * motorn tar kravlistan, företagets bedömning och sista anbudsdag, och lägger
 * fram handlingarna i den ordning ledtiderna kräver.
 *
 * Fyra regler styr allt den gör.
 *
 * **En tom lista är inte en tom checklista.** Är kravlistan inte känt
 * fullständig — saknas `requirementsExtraction` — vägrar motorn. En checklista
 * som säger "ingenting behövs" för att ingen läst underlaget är värre än ingen
 * checklista alls, eftersom den ser fullständig ut. Samma gräns som
 * kvalificeringsmotorn drar, av samma skäl.
 *
 * **Baslinjen står kvar även utan krav.** Egen försäkran, uteslutningsgrunder,
 * skatteuppgift, registreringsbevis och behörig underskrift följer av
 * regelverket och inte av den enskilda upphandlingen. En upphandling utan ett
 * enda kvalificeringskrav har alltså ändå en checklista.
 *
 * **Startdatum räknas bara ur en känd deadline.** Utan sista anbudsdag finns
 * ingen dag att räkna bakåt från, och motorn gissar aldrig fram en. Då redovisas
 * ledtiden i dagar i stället, vilket är sant och användbart.
 *
 * **Ordningen är ledtid, inte kravordning.** Det som tar längst tid att få fram
 * ska stå först, för det är det som avgör om anbudet hinner bli klart. Okänd
 * ledtid sorteras som lång och inte som kort — den som inte vet hur lång tid
 * något tar bör börja med det.
 */

import {
  BASELINE_EVIDENCE,
  EVIDENCE_FOR_REQUIREMENT,
  type EvidenceItem,
  evidenceItem,
  startBy,
} from "../domain/evidence";
import type { IsoDate, Procurement } from "../domain/ontology";
import { type Caveat, doctrineCaveat } from "../domain/regulations";
import type { RequirementAssessment } from "./eligibility";
import { daysBetween } from "./procedureGuide";

/* ------------------------------------------------------------------ */

/**
 * Varför posten står på listan.
 *
 * `baseline` följer av regelverket, `requirement` av ett krav i den här
 * upphandlingen. Skillnaden är värd att visa: den ena listan ser likadan ut
 * varje gång och blir rutin, den andra måste läsas om varje gång.
 */
export type ChecklistOrigin = "baseline" | "requirement";

/**
 * Hur brådskande posten är för just det här företaget.
 *
 * `gap` betyder att bedömningen fann att kravet inte är uppfyllt eller kan
 * åtgärdas — det är där arbetet ligger. `unproven` betyder att företaget kan
 * uppfylla kravet men att ingen uppgift finns; handlingen avgör saken.
 * `confirm` betyder att bedömningen redan säger att kravet är uppfyllt och att
 * handlingen bara ska bifogas.
 */
export type ChecklistUrgency = "gap" | "unproven" | "confirm" | "routine";

export interface ChecklistLink {
  requirementId: string;
  label: string;
  mandatory: boolean;
}

export interface ChecklistItem {
  evidence: EvidenceItem;
  origin: ChecklistOrigin;
  urgency: ChecklistUrgency;
  /** Kraven posten svarar mot. Tom för baslinjen. */
  becauseOf: ChecklistLink[];
  /**
   * Senaste dagen att börja hämta handlingen, när både deadline och ledtid är
   * kända. Saknas den är det för att en av dem saknas — aldrig en gissning.
   */
  startBy?: IsoDate;
  /** Sant när startdagen redan passerat. Följer av datumen, inte av omdöme. */
  overdue?: boolean;
}

export type EvidenceChecklist =
  | {
      status: "ready";
      items: ChecklistItem[];
      /** Längsta ledtiden på listan, när någon är känd. */
      longestLeadTimeDays?: number;
      /** Antal poster där ledtiden inte är känd. */
      unknownLeadTimes: number;
      explanation: string;
      caveats: Caveat[];
    }
  | {
      status: "unknown";
      explanation: string;
      caveats: Caveat[];
    };

/* ------------------------------------------------------------------ */

export interface ChecklistInput {
  procurement: Procurement;
  /** Bedömningen per krav. Tom lista är tillåtet; utelämnad är något annat. */
  assessments?: RequirementAssessment[];
  today: IsoDate;
}

function urgencyFor(assessment: RequirementAssessment | undefined): ChecklistUrgency {
  if (!assessment) return "routine";
  switch (assessment.status) {
    case "unmet":
    case "remediable":
      return "gap";
    case "unknown":
      return "unproven";
    case "met":
      return "confirm";
  }
}

/** Strängast vinner: en handling som svarar mot både en lucka och ett uppfyllt
 * krav är en lucka. Att låta det uppfyllda kravet mildra bilden vore att dölja
 * arbetet bakom ett medelvärde. */
const URGENCY_RANK: Record<ChecklistUrgency, number> = {
  gap: 3,
  unproven: 2,
  confirm: 1,
  routine: 0,
};

/* ------------------------------------------------------------------ */

/**
 * Checklistan utan upphandlingens datum.
 *
 * Vilka handlingar som krävs, var de hämtas och hur lång tid de tar är kunskap
 * om regelverket och står kvar på varje nivå. *När* de senast måste vara
 * påbörjade följer av sista anbudsdag, som är en betald uppgift.
 *
 * Ligger här och inte hos konsumenten, av samma skäl som
 * `redactWalkthroughDates` — se noten där.
 */
export function redactChecklistDates(
  checklist: EvidenceChecklist,
  fullDetail: boolean,
): EvidenceChecklist {
  if (fullDetail || checklist.status !== "ready") return checklist;
  return {
    ...checklist,
    items: checklist.items.map((item) => ({ ...item, startBy: undefined, overdue: undefined })),
    explanation: `${checklist.explanation} Startdatum ingår i Pro och uppåt; ledtiderna gäller ändå.`,
  };
}

export function buildEvidenceChecklist(input: ChecklistInput): EvidenceChecklist {
  const { procurement, assessments, today } = input;
  const caveats: Caveat[] = [
    doctrineCaveat("documentsGovern"),
    doctrineCaveat("selfDeclarationIsPreliminary"),
  ];

  // Utan bevis för att kravlistan är läst vet vi inte om den är fullständig,
  // och en checklista som ser fullständig ut är då det farligaste svaret.
  if (!procurement.requirementsExtraction) {
    return {
      status: "unknown",
      explanation:
        "Kravlistan för den här upphandlingen är inte känt fullständig — ingen har bekräftat att " +
        "underlaget är läst. En checklista skulle se ut som om den täckte allt, och det kan den " +
        "inte göra. Läs upphandlingsdokumenten och utgå från dem.",
      caveats,
    };
  }

  const byId = new Map<string, ChecklistItem>();

  const add = (
    id: string,
    origin: ChecklistOrigin,
    urgency: ChecklistUrgency,
    link?: ChecklistLink,
  ) => {
    const evidence = evidenceItem(id);
    // En kravtyp som pekar på ett bevis katalogen inte har är ett fel i
    // kopplingen, inte ett tomt krav. Att tyst hoppa över det skulle dölja
    // felet; testerna prövar i stället att varje id finns.
    if (!evidence) return;

    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, { evidence, origin, urgency, becauseOf: link ? [link] : [] });
      return;
    }
    if (link && !existing.becauseOf.some((l) => l.requirementId === link.requirementId)) {
      existing.becauseOf.push(link);
    }
    if (URGENCY_RANK[urgency] > URGENCY_RANK[existing.urgency]) existing.urgency = urgency;
    // Ett krav i upphandlingen väger tyngre än rutin: posten ska läsas om.
    if (origin === "requirement") existing.origin = "requirement";
  };

  for (const id of BASELINE_EVIDENCE) add(id, "baseline", "routine");

  const assessmentById = new Map((assessments ?? []).map((a) => [a.requirementId, a]));
  for (const requirement of procurement.requirements) {
    const link: ChecklistLink = {
      requirementId: requirement.id,
      label: requirement.label,
      mandatory: requirement.mandatory,
    };
    const urgency = urgencyFor(assessmentById.get(requirement.id));
    for (const id of EVIDENCE_FOR_REQUIREMENT[requirement.kind]) {
      add(id, "requirement", urgency, link);
    }
  }

  const deadline = procurement.deadlineAt;
  const items = [...byId.values()].map((item) => {
    const days = item.evidence.typicalLeadTimeDays;
    if (deadline === undefined || days === undefined) return item;
    const start = startBy(deadline, days);
    return { ...item, startBy: start, overdue: daysBetween(today, start) < 0 };
  });

  // Längst ledtid först; okänd ledtid räknas som längst, eftersom den som inte
  // vet hur lång tid något tar bör börja med det. Därefter angelägenhet, så att
  // luckorna står över de poster som bara ska bifogas.
  items.sort((a, b) => {
    const al = a.evidence.typicalLeadTimeDays ?? Number.POSITIVE_INFINITY;
    const bl = b.evidence.typicalLeadTimeDays ?? Number.POSITIVE_INFINITY;
    if (al !== bl) return bl - al;
    const ur = URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency];
    if (ur !== 0) return ur;
    return a.evidence.title.localeCompare(b.evidence.title, "sv");
  });

  const known = items
    .map((i) => i.evidence.typicalLeadTimeDays)
    .filter((d): d is number => d !== undefined);
  const longestLeadTimeDays = known.length > 0 ? Math.max(...known) : undefined;
  const unknownLeadTimes = items.length - known.length;

  const parts: string[] = [
    `Kravlistan och regelverket ger tillsammans ${items.length} handlingar att ha på plats.`,
  ];

  if (longestLeadTimeDays !== undefined && longestLeadTimeDays > 0) {
    parts.push(
      `Den som tar längst tid att få fram behöver ungefär ${longestLeadTimeDays} dagar — ` +
        "det är den som avgör när anbudsarbetet senast måste börja.",
    );
  }
  if (unknownLeadTimes > 0) {
    parts.push(
      `${unknownLeadTimes} ${unknownLeadTimes === 1 ? "handling har" : "handlingar har"} okänd ` +
        "ledtid. Okänd är inte kort — börja med dem.",
    );
  }
  if (deadline === undefined) {
    parts.push(
      "Sista anbudsdag saknas i underlaget vi har, så inga startdatum räknas ut. Ledtiderna " +
        "gäller ändå.",
    );
  }

  const gaps = items.filter((i) => i.urgency === "gap").length;
  const unproven = items.filter((i) => i.urgency === "unproven").length;
  if (gaps > 0) {
    parts.push(
      `${gaps} av dem svarar mot krav bedömningen inte fann uppfyllda — där ligger arbetet.`,
    );
  }
  if (unproven > 0) {
    parts.push(
      `${unproven} svarar mot krav där uppgift saknas i din profil. Att uppgiften saknas är inte ` +
        "samma sak som att kravet inte är uppfyllt; handlingen avgör saken.",
    );
  }

  return {
    status: "ready",
    items,
    longestLeadTimeDays,
    unknownLeadTimes,
    explanation: parts.join(" "),
    caveats,
  };
}
