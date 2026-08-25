/**
 * Regulatory layer.
 *
 * Thresholds and legal doctrine are *data*, not logic buried in an engine. They
 * change by decree, they differ per regime, and every one of them has to be
 * traceable to the authority that set it.
 *
 * Each threshold carries a `verification` flag. Anything not confirmed against
 * Upphandlingsmyndigheten's published table is `"unverified"`, and the engines
 * attach a caveat to any assessment that leans on it. The product rule — never
 * hand a company a legal answer it cannot check — applies to our own constants
 * before it applies to anything else.
 */

import type { IsoDate, RegulationCode, SourceRef } from "./ontology";

export interface DirectAwardThreshold {
  regulation: RegulationCode;
  /** Ceiling below which a direct award may be permissible, in SEK. */
  amountSek: number;
  effectiveFrom: IsoDate;
  /** Set when a later decision superseded this row. */
  effectiveUntil?: IsoDate;
  source: SourceRef;
  verification: "verified" | "unverified";
}

const UHM: SourceRef = {
  document: "Upphandlingsmyndigheten — tröskelvärden och direktupphandlingsgränser",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/troskelvarden-och-direktupphandlingsgranser/",
  retrievedAt: "2026-08-21",
};

/**
 * Direktupphandlingsgränser, kontrollerade mot källan 2026-08-21.
 *
 * LOU-, LUF- och LUFS-beloppen är fasta belopp angivna i lagen sedan de
 * förenklade upphandlingsreglerna trädde i kraft 2022-02-01, och ändras inte av
 * tröskelvärdesrevisionerna. LUK-gränsen är däremot 5 % av koncessions-
 * tröskelvärdet och justeras vartannat år — den kan aldrig vara en konstant
 * utan giltighetsperiod.
 *
 * Det var precis så det ursprungliga värdet var fel: 2 700 000 kr utan
 * slutdatum, och det verkliga beloppet var 2 994 008 kr under 2024–2025 och
 * 2 799 554 kr från 2026-01-01. Att raden var märkt `unverified` är vad som
 * höll felet ofarligt — bandet i `thresholdSettles` täckte båda de verkliga
 * beloppen, så inget besked hann lämnas på den felaktiga siffran.
 *
 * Före 2024-01-01 finns ingen LUK-rad: det beloppet är inte kontrollerat, och
 * en saknad rad ger `unknown` i stället för ett svar på en okontrollerad
 * siffra.
 *
 * En framtida revision läggs till som ny rad med `effectiveUntil` på den gamla
 * — aldrig genom att skriva över beloppet. En rad som ännu inte kontrollerats
 * mot källan förs in som `unverified`; spärrbandet gäller den då automatiskt.
 */
export const DIRECT_AWARD_THRESHOLDS: DirectAwardThreshold[] = [
  {
    regulation: "LOU",
    amountSek: 700_000,
    effectiveFrom: "2022-02-01",
    source: UHM,
    verification: "verified",
  },
  {
    regulation: "LUF",
    amountSek: 1_200_000,
    effectiveFrom: "2022-02-01",
    source: UHM,
    verification: "verified",
  },
  {
    regulation: "LUFS",
    amountSek: 1_200_000,
    effectiveFrom: "2022-02-01",
    source: UHM,
    verification: "verified",
  },
  {
    regulation: "LUK",
    amountSek: 2_994_008,
    effectiveFrom: "2024-01-01",
    effectiveUntil: "2026-01-01",
    source: UHM,
    verification: "verified",
  },
  {
    regulation: "LUK",
    amountSek: 2_799_554,
    effectiveFrom: "2026-01-01",
    source: UHM,
    verification: "verified",
  },
];

export function directAwardThresholdFor(
  regulation: RegulationCode,
  onDate: IsoDate,
): DirectAwardThreshold | undefined {
  return DIRECT_AWARD_THRESHOLDS.filter(
    (t) =>
      t.regulation === regulation &&
      t.effectiveFrom <= onDate &&
      (t.effectiveUntil === undefined || onDate < t.effectiveUntil),
  ).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

/**
 * Doctrine the engines quote verbatim rather than paraphrase. Each string is
 * shown to the user next to the assessment it constrains, so that a company
 * reads the limit at the same moment it reads the opportunity.
 */
export const DOCTRINE = {
  /**
   * The single most important guardrail in the product. Scarcity of local
   * suppliers is not a legal entitlement to the work.
   */
  noEntitlementFromScarcity:
    "Att det finns få eller bara en leverantör i närområdet ger ingen rätt till uppdraget. " +
    "Offentlig upphandling bygger bland annat på likabehandling, öppenhet och konkurrens.",

  /**
   * Direct award is the buyer's call, never the supplier's. The product may
   * point out that the conditions *look* met; it may never say a company is
   * entitled to a direct award.
   */
  directAwardIsBuyersDecision:
    "Direktupphandling är inget en leverantör kan kräva. Det är köparen som avgör om det går, " +
    "bland annat utifrån värdet och om ett avtal redan styr köpet.",

  /** Attached to every output of the price intelligence engine. */
  noPriceCoordination:
    "Uppgifterna är historiska och offentliga. De får inte användas för att samordna priser eller " +
    "anbud med konkurrenter. Systemet lämnar inga prisrekommendationer.",

  /**
   * DPS is the concrete route into the public market for a small supplier: the
   * admission window stays open, so a company can join without waiting for the
   * next procurement cycle.
   */
  dpsAdmissionStaysOpen:
    "Ett dynamiskt inköpssystem tar emot ansökningar hela tiden det gäller. " +
    "En leverantör som uppfyller kraven kan gå med även efter att systemet startat.",

  /** Framework agreements route the purchase; they do not open it. */
  frameworkGovernsPurchase:
    "Köpet styrs av ett avtal eller ramavtal som redan finns. Så länge avtalet gäller beställer " +
    "köparen från avtalet, inte genom en ny upphandling.",

  /**
   * Den dyraste missuppfattningen om ramavtal, och den som får små företag att
   * bemanna upp för intäkter som aldrig kommer.
   */
  frameworkGuaranteesNoVolume:
    "Ett ramavtal lovar normalt inga beställningar. Att bli antagen betyder att ni kan bli " +
    "tillfrågade — inte att köparen lovar att beställa för ett visst belopp.",

  /**
   * Annonsens belopp är ett tak för hela avtalet, inte en intäkt för en
   * leverantör. Skillnaden är antalet leverantörer gånger avtalets längd.
   */
  announcedValueIsNotYourRevenue:
    "Det annonserade värdet gäller hela avtalet under hela avtalstiden, och delas i ett ramavtal " +
    "mellan alla antagna leverantörer. Det är ett tak för köparen, inte en prognos för dig.",

  /**
   * Underlaget går före varje generell beskrivning systemet ger.
   *
   * Katalogen över bevis säger vad ett krav av ett visst slag *brukar* kräva.
   * Vad just den här upphandlingen kräver avgörs i dess egna administrativa
   * föreskrifter. Utan den gränsen blir en hjälpsam checklista till ett
   * påstående om ett dokument systemet inte har läst.
   */
  documentsGovern:
    "Listan bygger på kravlistan vi har och på vad krav av det slaget brukar kräva för bevis. " +
    "Vad som gäller i den här upphandlingen avgörs av dess upphandlingsdokument, och de går före.",

  /**
   * Egenförsäkran är ett preliminärt bevis, inte ett slutligt.
   *
   * Skillnaden är avgörande för ett företag som kryssar i en ruta: den som
   * vinner ska styrka det som försäkrats, och det är då ett förhastat kryss
   * upptäcks — efter att anbudsarbetet redan är gjort.
   */
  selfDeclarationIsPreliminary:
    "En egen försäkran (ESPD) är ett första bevis, inte ett slutligt. Den som ska få kontraktet " +
    "måste sedan visa handlingar som styrker uppgifterna, innan köparen beslutar.",

  /** Market dialogue is legitimate and useful, within limits. */
  marketDialogueIsAllowed:
    "Tidig dialog och marknadsanalys inför en upphandling är tillåtet och kan förbättra små och " +
    "medelstora företags möjligheter att delta, så länge köparen behandlar alla lika.",
} as const;

export type DoctrineKey = keyof typeof DOCTRINE;

/** A caveat carried alongside an assessment, tied to the doctrine that produced it. */
export interface Caveat {
  key: DoctrineKey | "unverified_threshold" | "unreviewed_extraction";
  text: string;
  source?: SourceRef;
}

export function doctrineCaveat(key: DoctrineKey): Caveat {
  return { key, text: DOCTRINE[key] };
}

/**
 * How close to an *unverified* threshold a value may sit before the system
 * refuses to decide.
 *
 * A caveat under a confident answer is not enough here. If the number that
 * decides the answer is one we cannot vouch for, then near that number the
 * answer itself is unfounded — not merely qualified. A company reading
 * "this must be competitively procured" acts on it; the footnote does not
 * undo the sentence.
 *
 * The band is deliberately asymmetric in effect. Far from the threshold, even
 * a materially wrong constant does not flip the outcome, so the answer stands
 * (with its caveat). Near it, a single revision of the limit changes the
 * answer, so there is no answer to give.
 *
 * **The width is a policy choice, not a measurement.** It is not derived from
 * observed revisions of Swedish direct-award limits — we have not verified
 * those either. It is set wide enough that a plausible revision of an
 * unverified constant falls inside it, and erring wide only ever withholds an
 * answer, which is the safe direction. A `verified` threshold gets no band at
 * all: a number we can vouch for decides right up to its edge.
 */
export const UNVERIFIED_THRESHOLD_MARGIN = 0.25;

/**
 * Can this threshold settle the question for this value?
 *
 * `false` means the engine must answer `unknown` rather than pick a side.
 */
export function thresholdSettles(threshold: DirectAwardThreshold, valueSek: number): boolean {
  if (threshold.verification === "verified") return true;
  const margin = threshold.amountSek * UNVERIFIED_THRESHOLD_MARGIN;
  return valueSek < threshold.amountSek - margin || valueSek > threshold.amountSek + margin;
}

/**
 * Bedömningen vilar på en kravlista en maskin läst och ingen granskat.
 *
 * Ett förbehåll och inte en nedgradering, till skillnad från bandet kring en
 * overifierad tröskel ovan — och skillnaden är inte godtycklig. Där avgör talet
 * *vilket* av två motsatta juridiska svar som gäller, så nära gränsen finns
 * inget svar att ge. Här är svaret sant om listan: företaget uppfyller de krav
 * som lästs. Risken är att listan är fel läst, och den risken minskar inte av
 * att systemet tiger — den blir bara osynlig.
 *
 * Att i stället svara `OKÄNT` på varje maskinläst upphandling vore att göra
 * extraktionen värdelös, och därmed omöjlig att skeppa innan den är perfekt.
 * Det är precis den avvägningen motorn är byggd för att klara: läser modellen
 * fel blir kravet `other` → `unknown` → `OKÄNT` av sig självt. Kvar är fallet
 * där tolkningen ser bra ut men ingen kontrollerat den, och det ska stå i
 * klartext bredvid beskedet.
 */
export function unreviewedExtractionCaveat(source?: SourceRef): Caveat {
  return {
    key: "unreviewed_extraction",
    text:
      "Kravlistan är läst av en dator och inte granskad av en människa. " +
      "Kontrollera kraven mot originaldokumentet innan du lägger tid på anbudet.",
    source,
  };
}

export function unverifiedThresholdCaveat(threshold: DirectAwardThreshold): Caveat {
  return {
    key: "unverified_threshold",
    text:
      `Direktupphandlingsgränsen för ${threshold.regulation} anges här som ` +
      `${threshold.amountSek.toLocaleString("sv-SE")} kr, men vi har inte kontrollerat den mot källan. ` +
      "Kontrollera vilket belopp som gäller innan du agerar på bedömningen.",
    source: threshold.source,
  };
}
