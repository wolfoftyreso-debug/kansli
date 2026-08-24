/**
 * Vad avtalet faktiskt är värt — för dig.
 *
 * Beloppet i annonsen är nästan aldrig det man får, och de fyra sätten att läsa
 * fel kostar olika mycket:
 *
 * **Årstakt eller totalvärde.** "14 000 000 kr" på ett fyraårigt avtal är
 * 3,5 miljoner om året. Fyra gångers fel avgör om man kan bemanna uppdraget.
 *
 * **Optionsår.** Ett avtal på 2+1+1 är två år tills någon annan bestämmer
 * något. En outnyttjad option är verklig osäkerhet, och att räkna den som
 * säkrad intäkt är hur ett företag anställer för år tre och fyra som aldrig
 * kommer.
 *
 * **Ramavtal delas.** Fem antagna leverantörer på 20 miljoner är inte 20
 * miljoner för någon av dem.
 *
 * **Ramavtal garanterar ingen volym.** Att bli antagen är att få rätten att bli
 * tillfrågad. Det är den dyraste missuppfattningen i hela produkten, och den
 * står som doktrin bredvid varje beräkning som rör ett ramavtal.
 *
 * Motorn räknar det som går att räkna och säger `unknown` om resten — den
 * gissar aldrig en andel. Hur mycket just du får ur ett ramavtal beror på
 * beställningar som ännu inte lagts, och det är inte en siffra någon kan ge.
 */

import type { Contract, IsoDate, Procurement } from "../domain/ontology";
import { type Caveat, doctrineCaveat } from "../domain/regulations";

/* ------------------------------------------------------------------ */

/** Hur stor del av avtalet som rimligen kan bli din — eller varför det inte går att säga. */
export type ShareAssessment =
  /** Ett kontrakt med en leverantör: hela värdet avser den som vinner. */
  | { status: "whole"; explanation: string }
  /** Ramavtal med rangordning: platsen i ordningen avgör, men inte volymen. */
  | { status: "ranked"; rank: number; supplierCount: number; explanation: string }
  /** Ramavtal med förnyad konkurrensutsättning: varje avrop är en ny tävling. */
  | { status: "competed"; supplierCount: number; explanation: string }
  | { status: "unknown"; explanation: string };

export interface ValueBreakdown {
  /** Grundavtalets längd i månader. */
  baseMonths: number;
  /** Optionsmånader som är utnyttjade — alltså säkrade. */
  exercisedOptionMonths: number;
  /** Optionsmånader som ingen ännu bestämt om. Osäkerhet, inte intäkt. */
  undecidedOptionMonths: number;
  /** Optionsmånader som tackats nej till. */
  declinedOptionMonths: number;
  /** Bas plus utnyttjade optioner: den tid som faktiskt är beslutad. */
  securedMonths: number;
  /** Säkrad tid plus oavgjorda optioner: längsta möjliga avtalstid. */
  maximumMonths: number;
  /** Det publicerade värdet, när det finns. */
  totalValueSek?: number;
  /**
   * Värde per år räknat på den **säkrade** tiden.
   *
   * Säkrad och inte längsta möjliga, eftersom en årstakt som slås ut över
   * optionsår som kanske aldrig utlöses ser lägre ut än den är — och en för låg
   * årstakt är precis det fel som får någon att räkna hem ett uppdrag som inte
   * går ihop.
   */
  annualValueSek?: number;
  yourShare: ShareAssessment;
  explanation: string;
  caveats: Caveat[];
}

/* ------------------------------------------------------------------ */

/** Hela månader mellan två datum, avrundat till närmaste. */
export function monthsBetween(from: IsoDate, to: IsoDate): number {
  const a = new Date(`${from}T00:00:00Z`);
  const b = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return Number.NaN;
  const months =
    (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  // Dagen i månaden avgör om den sista månaden är hel.
  return b.getUTCDate() >= a.getUTCDate() ? months : months - 1;
}

/**
 * Avtalstiden i månader.
 *
 * Skild från `monthsBetween` av en anledning som är lätt att missa och som
 * syntes först när ett tal räknades ut: **ett avtals slutdatum är inklusive.**
 * "2027-01-01–2030-12-31" är fyra år i varje underlag, i varje annons och för
 * varje människa som läser det — men som ren datumdifferens är det 47 månader
 * och 30 dagar.
 *
 * Skillnaden är inte akademisk. Den slår rakt in i årstakten, och den hade fått
 * gränssnittet att skriva "47 månader" om något alla kallar fyra år.
 */
export function termMonths(start: IsoDate, end: IsoDate): number {
  const inclusiveEnd = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(inclusiveEnd.getTime())) return Number.NaN;
  inclusiveEnd.setUTCDate(inclusiveEnd.getUTCDate() + 1);
  return monthsBetween(start, inclusiveEnd.toISOString().slice(0, 10));
}

function sek(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

function years(months: number): string {
  if (months % 12 === 0) return `${months / 12} år`;
  return `${months} månader`;
}

/* ------------------------------------------------------------------ */

/**
 * Andelen, för ett ramavtal eller ett enskilt kontrakt.
 *
 * Ingen gren returnerar ett belopp. Rangordning ger en *position*, förnyad
 * konkurrensutsättning ger ett *antal konkurrenter* — men volymen beror på
 * beställningar som ännu inte lagts, och den siffran finns inte att ge.
 */
function assessShare(contract: Contract, companyId?: string): ShareAssessment {
  if (!contract.isFramework) {
    return {
      status: "whole",
      explanation:
        "Ett enskilt kontrakt: värdet avser det uppdrag som tilldelas, och delas inte med " +
        "andra leverantörer.",
    };
  }

  const rankings = contract.frameworkRankings ?? [];
  const supplierCount = rankings.length;

  if (contract.callOffMethod === "rank") {
    const mine = companyId ? rankings.find((r) => r.supplierId === companyId) : undefined;
    if (mine) {
      return {
        status: "ranked",
        rank: mine.rank,
        supplierCount,
        explanation:
          mine.rank === 1
            ? `Du är rangordnad etta av ${supplierCount}. Avrop går till dig först — men bara ` +
              "för de behov som faktiskt uppstår, och avtalet garanterar ingen volym."
            : `Du är rangordnad ${mine.rank} av ${supplierCount}. Avrop når dig först när de ` +
              `${mine.rank - 1} före dig tackat nej eller inte kan leverera.`,
      };
    }
    return {
      status: "ranked",
      rank: Number.NaN,
      supplierCount,
      explanation:
        `Ramavtalet har rangordning mellan ${supplierCount} leverantörer. Vilken plats som ` +
        "gäller för dig framgår inte av det som är känt här.",
    };
  }

  if (contract.callOffMethod === "renewed_competition") {
    return {
      status: "competed",
      supplierCount,
      explanation:
        `Avrop sker genom förnyad konkurrensutsättning mellan ${supplierCount} antagna ` +
        "leverantörer. Varje avrop är en egen tävling, så avtalet ger dig rätten att lämna " +
        "anbud — inte en andel av värdet.",
    };
  }

  return {
    status: "unknown",
    explanation:
      "Ramavtalets avropsordning framgår inte av det som är känt här, och den avgör om du kan " +
      "påverka utgången eller bara vänta på din tur. Leta efter avsnittet om avrop i avtalet.",
  };
}

/* ------------------------------------------------------------------ */

/**
 * Bryter ned ett avtals värde och längd.
 *
 * `companyId` används enbart för att hitta den egna rangordningsplatsen. Utan
 * den blir andelen mindre precis, aldrig felaktig.
 */
export function assessContractValue(contract: Contract, companyId?: string): ValueBreakdown {
  const baseMonths = termMonths(contract.startDate, contract.endDate);

  let exercised = 0;
  let undecided = 0;
  let declined = 0;
  for (const option of contract.options) {
    if (option.exercised === true) exercised += option.extensionMonths;
    else if (option.exercised === false) declined += option.extensionMonths;
    else undecided += option.extensionMonths;
  }

  const securedMonths = baseMonths + exercised;
  const maximumMonths = securedMonths + undecided;

  const caveats: Caveat[] = [];
  if (contract.isFramework) {
    caveats.push(doctrineCaveat("frameworkGuaranteesNoVolume"));
    caveats.push(doctrineCaveat("announcedValueIsNotYourRevenue"));
  }

  const annual =
    contract.valueSek !== undefined && securedMonths > 0
      ? (contract.valueSek / securedMonths) * 12
      : undefined;

  const parts: string[] = [
    `Grundavtal ${years(baseMonths)} (${contract.startDate}–${contract.endDate}).`,
  ];
  if (exercised > 0) parts.push(`Utnyttjade optioner: ${years(exercised)}, alltså säkrad tid.`);
  if (undecided > 0) {
    parts.push(
      `Ej beslutade optioner: ${years(undecided)}. De är möjlig framtid, inte säkrad intäkt — ` +
        "det är köparen som avgör om de utlöses.",
    );
  }
  if (declined > 0) parts.push(`Optioner som tackats nej till: ${years(declined)}.`);
  if (annual !== undefined) {
    parts.push(
      `Publicerat värde ${sek(contract.valueSek!)} över den säkrade tiden ger ${sek(annual)} ` +
        "per år.",
    );
  } else if (contract.valueSek === undefined) {
    parts.push("Något värde är inte publicerat, så någon årstakt går inte att räkna fram.");
  }

  return {
    baseMonths,
    exercisedOptionMonths: exercised,
    undecidedOptionMonths: undecided,
    declinedOptionMonths: declined,
    securedMonths,
    maximumMonths,
    totalValueSek: contract.valueSek,
    annualValueSek: annual,
    yourShare: assessShare(contract, companyId),
    explanation: parts.join(" "),
    caveats,
  };
}

/**
 * Samma nedbrytning för en annonserad upphandling.
 *
 * En upphandling bär inga optioner i modellen — de tillhör avtalet som följer.
 * Avtalstiden går däremot ofta att läsa ut, och det räcker för den viktigaste
 * uträkningen: årstakten. Att den publicerade summan avser hela avtalstiden och
 * inte ett år är den vanligaste felläsningen av en annons.
 */
export function assessProcurementValue(procurement: Procurement): ValueBreakdown {
  const hasTerm = Boolean(procurement.contractStart && procurement.contractEnd);
  const baseMonths = hasTerm ? termMonths(procurement.contractStart!, procurement.contractEnd!) : 0;

  const annual =
    procurement.estimatedValueSek !== undefined && baseMonths > 0
      ? (procurement.estimatedValueSek / baseMonths) * 12
      : undefined;

  const caveats: Caveat[] = [];
  if (procurement.procedure === "framework_call_off") {
    caveats.push(doctrineCaveat("frameworkGuaranteesNoVolume"));
  }
  if (procurement.estimatedValueSek !== undefined) {
    caveats.push(doctrineCaveat("announcedValueIsNotYourRevenue"));
  }

  const parts: string[] = [];
  if (hasTerm) {
    parts.push(
      `Avtalstid ${years(baseMonths)} (${procurement.contractStart}–${procurement.contractEnd}).`,
    );
  } else {
    parts.push("Avtalstiden är inte publicerad, så någon årstakt går inte att räkna fram.");
  }

  if (procurement.estimatedValueSek === undefined) {
    parts.push("Något uppskattat värde är inte publicerat.");
  } else if (annual !== undefined) {
    parts.push(
      `Uppskattat värde ${sek(procurement.estimatedValueSek)} avser hela avtalstiden, vilket ` +
        `motsvarar ${sek(annual)} per år.`,
    );
  } else {
    parts.push(`Uppskattat värde ${sek(procurement.estimatedValueSek)} för hela avtalstiden.`);
  }

  return {
    baseMonths,
    exercisedOptionMonths: 0,
    undecidedOptionMonths: 0,
    declinedOptionMonths: 0,
    securedMonths: baseMonths,
    maximumMonths: baseMonths,
    totalValueSek: procurement.estimatedValueSek,
    annualValueSek: annual,
    yourShare:
      procurement.procedure === "framework_call_off"
        ? {
            status: "unknown",
            explanation:
              "Köpet är ett avrop under ett ramavtal. Hur stor del som kan bli din avgörs av " +
              "avtalets avropsordning, inte av det annonserade värdet.",
          }
        : {
            status: "whole",
            explanation:
              "Upphandlingen avser ett kontrakt som tilldelas en leverantör. Vinner du är " +
              "värdet ditt — inom ramen för vad som faktiskt beställs.",
          },
    explanation: parts.join(" "),
    caveats,
  };
}
