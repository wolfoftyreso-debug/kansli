/**
 * Vilka vägar som fortfarande är öppna, och när de stänger.
 *
 * Motorn räknar fram fristerna mot upphandlingens egna datum. Det låter enkelt
 * och är det inte, eftersom de två datum som styr allt — den dag underrättelsen
 * om tilldelning skickades och den dag avtalet slöts — är precis de datum ett
 * publikt underlag oftast inte innehåller.
 *
 * Därför gäller tre regler, och de är stramare här än någon annanstans i
 * systemet.
 *
 * **Ett datum vi bara approximerar sägs vara approximerat.** Vi har
 * tilldelningsdatumet, inte utskicksdagen. De sammanfaller ofta men inte
 * alltid, och en dags fel är skillnaden mellan en prövning och ingen. Varje
 * uträknad slutdag bär därför vilket datum den vilar på och hur säkert det är,
 * och texten säger rakt ut att beskedet i din egen hand går före.
 *
 * **Utan ankardatum räknas ingenting.** Då redovisas regeln i stället — "tio
 * dagar från underrättelsen" är användbart även utan en kalenderdag, medan en
 * gissad kalenderdag är farlig.
 *
 * **Motorn bedömer aldrig om det finns grund.** Den säger vad som är öppet och
 * när det stänger. Om något gått fel avgörs av ett underlag systemet inte läst.
 */

import type { IsoDate, ProcurementGraph } from "../domain/ontology";
import {
  ANCHOR_LABEL,
  type DeadlineAnchor,
  type Remedy,
  REMEDIES,
} from "../domain/remedies";
import { daysBetween } from "./procedureGuide";

/* ------------------------------------------------------------------ */

/**
 * Hur väl det datum uträkningen vilar på är känt.
 *
 * `stated` — datumet står i underlaget och avser det fristen räknas från.
 * `approximated` — vi har ett närliggande datum, men inte exakt det lagen
 * pekar på. Skillnaden syns i texten och i fältet, aldrig bara i en fotnot.
 * `missing` — inget datum. Då räknas ingen slutdag.
 */
export type AnchorCertainty = "stated" | "approximated" | "missing";

export type WindowState = "open" | "closing_soon" | "closed" | "unknown";

/** Så nära en stängning att den bör hanteras i dag och inte i morgon. */
export const CLOSING_SOON_DAYS = 3;

export interface RemedyWindow {
  remedy: Remedy;
  state: WindowState;
  /** Sista dag att agera, när ett ankardatum finns. Aldrig en gissning. */
  closesOn?: IsoDate;
  /** Dagar kvar till `closesOn`. Negativt betyder passerat. */
  daysLeft?: number;
  anchor: DeadlineAnchor;
  anchorDate?: IsoDate;
  anchorCertainty: AnchorCertainty;
  /** Varför slutdagen ser ut som den gör — eller varför den saknas. */
  basis: string;
}

export interface RemedyOutlook {
  windows: RemedyWindow[];
  /** Sammanfattning i klarspråk. Aldrig ett råd om att gå till domstol. */
  summary: string;
}

/* ------------------------------------------------------------------ */

function addPeriod(date: IsoDate, amount: number, unit: "days" | "months" | "years"): IsoDate {
  const d = new Date(`${date}T00:00:00Z`);
  if (unit === "days") d.setUTCDate(d.getUTCDate() + amount);
  if (unit === "months") d.setUTCMonth(d.getUTCMonth() + amount);
  if (unit === "years") d.setUTCFullYear(d.getUTCFullYear() + amount);
  return d.toISOString().slice(0, 10) as IsoDate;
}

interface Anchors {
  award_notice_sent?: { date: IsoDate; certainty: AnchorCertainty };
  contract_concluded?: { date: IsoDate; certainty: AnchorCertainty };
}

/**
 * De två datum allt hänger på, hämtade ur det underlag vi faktiskt har.
 *
 * `Award.awardedAt` är dagen tilldelningen skedde. Avtalsspärren löper från
 * dagen underrättelsen *skickades*. Det är oftast samma dag och ibland inte, så
 * datumet märks `approximated` — och det ordet bärs hela vägen ut i texten.
 *
 * Dagen avtalet slöts modelleras inte alls. Kontraktets `startDate` är
 * leveransstart och inte signeringsdag; att använda den som ankare vore att
 * uppfinna ett datum som en frist sedan räknas ifrån. Den lämnas därför saknad.
 */
function anchorsFor(procurementId: string, graph: ProcurementGraph): Anchors {
  const award = graph.awards.find((a) => a.procurementId === procurementId);
  return {
    award_notice_sent: award
      ? { date: award.awardedAt, certainty: "approximated" }
      : undefined,
    contract_concluded: undefined,
  };
}

function describeMissing(anchor: DeadlineAnchor): string {
  return (
    `Ingen slutdag räknas ut: ${ANCHOR_LABEL[anchor]} finns inte i underlaget vi har. ` +
    "Fristen gäller ändå — räkna den från det datum som står på ditt eget besked."
  );
}

/* ------------------------------------------------------------------ */

/**
 * Motorn tar upphandlingens id och inte hela upphandlingen.
 *
 * Den läser bara ett fält, och en signatur som begär mer än den använder gör
 * anropssidan svårare utan att göra svaret bättre: en detaljvy utan känd
 * upphandling hade behövt hitta på ett objekt att skicka in. Med ett id blir
 * det fallet vad det är — en tom sträng matchar ingen tilldelning, och alla
 * vägar svarar `unknown`.
 */
/**
 * Vägarna utan upphandlingens uträknade datum.
 *
 * Reglerna, domstolarna, kostnaderna och fallgroparna står kvar på varje nivå —
 * en frist som passerar går inte att få tillbaka, och kunskapen om den är
 * billigast att ge bort. Slutdagarna är däremot härledda ur upphandlingens egna
 * datum och följer `redactWalkthroughDates`.
 */
export function redactRemedyDates(outlook: RemedyOutlook, fullDetail: boolean): RemedyOutlook {
  if (fullDetail) return outlook;
  return {
    ...outlook,
    windows: outlook.windows.map((w) =>
      w.closesOn === undefined
        ? w
        : {
            ...w,
            state: "unknown" as const,
            closesOn: undefined,
            daysLeft: undefined,
            anchorDate: undefined,
            basis:
              "Slutdatum ingår i Pro och uppåt. Fristen och regeln gäller ändå — räkna den från " +
              "det datum som står på ditt eget besked.",
          },
    ),
    summary:
      "Vilka vägar som finns och när de stänger räknas mot upphandlingens datum, som ingår i Pro " +
      "och uppåt. Reglerna nedan gäller oavsett nivå. Systemet bedömer inte om något gått fel i " +
      "den här upphandlingen — det avgörs av underlaget och av en juridisk bedömning.",
  };
}

export function buildRemedyOutlook(
  procurementId: string,
  graph: ProcurementGraph,
  today: IsoDate,
): RemedyOutlook {
  const anchors = anchorsFor(procurementId, graph);

  const windows: RemedyWindow[] = REMEDIES.map((remedy) => {
    const anchor = remedy.deadline.anchor;
    const known = anchors[anchor];

    if (!known) {
      return {
        remedy,
        state: "unknown" as const,
        anchor,
        anchorCertainty: "missing" as const,
        basis: describeMissing(anchor),
      };
    }

    const closesOn = addPeriod(known.date, remedy.deadline.amount, remedy.deadline.unit);
    const daysLeft = daysBetween(today, closesOn);
    const state: WindowState =
      daysLeft < 0 ? "closed" : daysLeft <= CLOSING_SOON_DAYS ? "closing_soon" : "open";

    const hedge =
      known.certainty === "approximated"
        ? " Datumet är tilldelningsdagen i underlaget, inte utskicksdagen — står ett annat datum " +
          "på ditt besked är det det som gäller."
        : "";

    return {
      remedy,
      state,
      closesOn,
      daysLeft,
      anchor,
      anchorDate: known.date,
      anchorCertainty: known.certainty,
      basis: `Räknat från ${ANCHOR_LABEL[anchor]}, ${known.date}.${hedge}`,
    };
  });

  const open = windows.filter((w) => w.state === "open" || w.state === "closing_soon");
  const urgent = windows.filter((w) => w.state === "closing_soon");
  const closed = windows.filter((w) => w.state === "closed");
  const unknown = windows.filter((w) => w.state === "unknown");

  const parts: string[] = [];

  if (urgent.length > 0) {
    // Det enda stället i systemet där en frist får skrivas ut som brådskande.
    // Den som inte agerar inom spärren förlorar rätten helt, och det är ett
    // faktum om kalendern och inte ett råd om att processa.
    parts.push(
      `${urgent.length === 1 ? "En väg stänger" : `${urgent.length} vägar stänger`} inom ` +
        `${CLOSING_SOON_DAYS} dagar: ${urgent.map((w) => w.remedy.title.toLowerCase()).join(", ")}.`,
    );
  }
  if (open.length > 0) {
    parts.push(
      `${open.length} av ${windows.length} vägar är öppna utifrån de datum vi har.`,
    );
  }
  if (closed.length > 0) {
    parts.push(
      `${closed.length} har passerat: ${closed.map((w) => w.remedy.title.toLowerCase()).join(", ")}.`,
    );
  }
  if (unknown.length > 0) {
    parts.push(
      `För ${unknown.length} går ingen slutdag att räkna ut, eftersom datumet fristen utgår från ` +
        "inte finns i underlaget. Fristerna gäller ändå.",
    );
  }

  parts.push(
    "Systemet bedömer inte om något gått fel i den här upphandlingen — det avgörs av underlaget " +
      "och av en juridisk bedömning. Det som står här är vilka vägar som finns och när de stänger.",
  );

  return { windows, summary: parts.join(" ") };
}
