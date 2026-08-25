/**
 * Rättsmedlen — vad som går att göra när något gått fel.
 *
 * Det här är den del av upphandlingsrätten som småföretag känner sämst till och
 * som har de hårdaste fristerna. Tre missuppfattningar är så vanliga att de är
 * skälet till att filen finns:
 *
 * **"Det kostar för mycket att gå till domstol."** En ansökan om överprövning
 * kostar ingen ansökningsavgift, och i förvaltningsdomstol står vardera parten
 * för sina egna kostnader — den som förlorar betalar alltså inte köparens
 * ombud. Det är en helt annan riskbild än den de flesta föreställer sig.
 *
 * **"Jag hinner fundera på det ett tag."** Avtalsspärren är tio dagar. Ansökan
 * ska ha *kommit in* till förvaltningsrätten innan den löper ut; att den
 * skickats i tid räcker inte. Efter det är rätten att få själva upphandlingen
 * prövad förlorad, oavsett hur fel det gick till.
 *
 * **"Nu är avtalet tecknat, då är det kört."** Inte nödvändigtvis. Ett avtal
 * kan angripas för ogiltighet, och skadestånd prövas i allmän domstol med en
 * helt egen frist. Vägarna är olika, leder till olika saker, och stängs vid
 * olika tidpunkter.
 *
 * **Gränsen som gäller överallt här: systemet bedömer aldrig om något gått
 * fel.** Det säger vilka vägar som finns, vad var och en kan leda till, och när
 * de stänger. Om det finns grund för en ansökan är en juridisk bedömning av ett
 * underlag systemet inte har läst, och att antyda något annat vore att skicka
 * någon till domstol på vår gissning.
 *
 * Varje frist bär `verification` av samma slag som tröskelvärdena. En uppgift om
 * juridik som ingen kontrollerat får inte presenteras som om någon gjort det.
 */

import type { SourceRef } from "./ontology";

/* ------------------------------------------------------------------ */

const UHM_REVIEW: SourceRef = {
  document: "Upphandlingsmyndigheten — överprövning och andra rättsmedel",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/overprovning-och-andra-rattsmedel/overprovning/",
  retrievedAt: "2026-08-22",
};

const UHM_CONTRACT_VALIDITY: SourceRef = {
  document: "Upphandlingsmyndigheten — överprövning av ett avtals giltighet",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/overprovning-och-andra-rattsmedel/overprovning/avtals-giltighet/",
  retrievedAt: "2026-08-22",
};

const UHM_DAMAGES: SourceRef = {
  document: "Upphandlingsmyndigheten — skadestånd vid offentlig upphandling",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/overprovning-och-andra-rattsmedel/skadestand/",
  retrievedAt: "2026-08-22",
};

const UHM_COURT_PROCESS: SourceRef = {
  document: "Upphandlingsmyndigheten — domstolsprocessen vid överprövning",
  url: "https://www.upphandlingsmyndigheten.se/regler-och-lagstiftning/overprovning-och-andra-rattsmedel/overprovning/domstolsprocessen/",
  retrievedAt: "2026-08-22",
};

/* ------------------------------------------------------------------ */

export type Court = "administrative" | "general";

export const COURT_LABEL: Record<Court, string> = {
  administrative: "Förvaltningsrätten",
  general: "Tingsrätten (allmän domstol)",
};

/**
 * Vilken händelse fristen räknas från.
 *
 * Distinktionen är hela poängen med att modellera det. Avtalsspärren löper från
 * den dag *underrättelsen om tilldelningsbeslut skickades* — inte från den dag
 * beslutet fattades, och inte från den dag leverantören läste det. De sex och
 * tolv månaderna löper från den dag *avtalet slöts*. Att blanda ihop dem är att
 * räkna fel på en frist som inte går att få tillbaka.
 */
export type DeadlineAnchor = "award_notice_sent" | "contract_concluded";

export const ANCHOR_LABEL: Record<DeadlineAnchor, string> = {
  award_notice_sent: "den dag underrättelsen om tilldelningsbeslut skickades",
  contract_concluded: "den dag avtalet slöts",
};

export interface RemedyDeadline {
  anchor: DeadlineAnchor;
  /** Fristens längd. Uttrycks i den enhet lagen använder. */
  amount: number;
  unit: "days" | "months" | "years";
  /** Regeln i klartext, som den ska kunna citeras. */
  rule: string;
  source: SourceRef;
  verification: "verified" | "unverified";
}

export type RemedyKey = "review_procurement" | "contract_validity" | "damages";

export interface Remedy {
  key: RemedyKey;
  title: string;
  court: Court;
  /** Vad vägen prövar. */
  what: string;
  /** Vad den kan leda till — och vad den inte kan. */
  outcome: string;
  cannot: string;
  deadline: RemedyDeadline;
  /** Vad det kostar att gå den här vägen. */
  cost: string;
  costSource: SourceRef;
  costVerification: "verified" | "unverified";
  /** Det som oftast går fel med just den här vägen. */
  pitfall: string;
}

/* ------------------------------------------------------------------ */

export const REMEDIES: Remedy[] = [
  {
    key: "review_procurement",
    title: "Överklaga upphandlingen",
    court: "administrative",
    what:
      "Domstolen prövar om upphandlingen gått till enligt reglerna — innan avtal tecknas. " +
      "Det är den enda vägen som kan stoppa ett felaktigt förfarande innan det blir bindande.",
    outcome:
      "Rätten kan besluta att upphandlingen ska göras om, eller att den får avslutas först sedan " +
      "den rättats — till exempel att utvärderingen görs om utan ett krav som inte fick ställas.",
    cannot:
      "Domstolen tilldelar aldrig kontraktet till dig. Den prövar förfarandet, inte vem som borde ha vunnit.",
    deadline: {
      anchor: "award_notice_sent",
      amount: 10,
      unit: "days",
      rule:
        "Ansökan ska ha kommit in till förvaltningsrätten innan avtalsspärren löper ut. Spärren är " +
        "tio dagar när underrättelsen skickats elektroniskt, femton dagar vid annat utskickssätt.",
      source: UHM_REVIEW,
      verification: "verified",
    },
    cost:
      "Ingen ansökningsavgift. I förvaltningsdomstol står vardera parten för sina egna kostnader — " +
      "den som förlorar betalar alltså inte motpartens ombud.",
    costSource: UHM_COURT_PROCESS,
    costVerification: "verified",
    pitfall:
      "Ansökan ska ha *kommit in* innan spärren löper ut. Att den skickats i tid räcker inte, och " +
      "fristen förlängs inte av att den sista dagen är en helgdag i din planering.",
  },

  {
    key: "contract_validity",
    title: "Överklaga själva avtalet",
    court: "administrative",
    what:
      "Domstolen prövar om ett redan tecknat avtal ska förklaras ogiltigt — till exempel när köpet " +
      "gjorts helt utan annonsering, eller när avtal tecknats trots att avtalsspärr gällde.",
    outcome: "Rätten kan förklara avtalet ogiltigt, vilket innebär att det inte får fullföljas.",
    cannot:
      "Ogiltighet ger inte dig uppdraget. Köpet får i så fall göras om, och du konkurrerar på nytt.",
    deadline: {
      anchor: "contract_concluded",
      amount: 6,
      unit: "months",
      rule: "Ansökan ska ha kommit in inom sex månader från det att avtalet slöts (20 kap. 17 § LOU).",
      source: UHM_CONTRACT_VALIDITY,
      verification: "verified",
    },
    cost:
      "Ingen ansökningsavgift, och vardera parten står för sina egna kostnader — samma sak som " +
      "när ni överklagar upphandlingen.",
    costSource: UHM_COURT_PROCESS,
    costVerification: "verified",
    pitfall:
      "Sexmånadersfristen kan vara kortare i vissa fall, bland annat när köparen annonserat sin " +
      "avsikt i förväg eller efterannonserat. Vilket som gäller avgörs av vad köparen faktiskt " +
      "publicerat — läs annonsen innan du räknar på sex månader.",
  },

  {
    key: "damages",
    title: "Skadestånd",
    court: "general",
    what:
      "Talan om ersättning för den skada ett regelbrott orsakat dig. Den prövas i allmän domstol " +
      "och inte i förvaltningsrätt — det är en annan domstol, en annan process och en annan frist.",
    outcome:
      "Domstolen kan döma ut ersättning. Vad som ersätts beror på vad som kan visas — kostnaden för " +
      "anbudsarbetet ligger närmare till hands än den uteblivna vinsten.",
    cannot: "Skadestånd påverkar inte avtalet. Det som tecknats fortsätter att gälla.",
    deadline: {
      anchor: "contract_concluded",
      amount: 1,
      unit: "years",
      rule:
        "Talan ska väckas vid allmän domstol inom ett år från det att avtal slöts, eller från det " +
        "att ett avtal förklarats ogiltigt genom ett avgörande som fått laga kraft.",
      source: UHM_DAMAGES,
      verification: "verified",
    },
    cost:
      "Här gäller vanliga civilprocessregler: den som förlorar kan få betala motpartens " +
      "rättegångskostnader. Risken är alltså en annan än när ni överklagar.",
    costSource: UHM_DAMAGES,
    costVerification: "unverified",
    pitfall:
      "Att ett överklagande gått din väg innebär inte att skadestånd följer automatiskt. Det är " +
      "en egen talan, i en egen domstol, som måste väckas inom sin egen frist.",
  },
];

export function remedy(key: RemedyKey): Remedy {
  const found = REMEDIES.find((r) => r.key === key);
  // Nycklarna är en sluten union; träffas inte någon är det ett programmeringsfel
  // och inte ett tomt svar, så det ska höras direkt.
  if (!found) throw new Error(`okänt rättsmedel: ${key}`);
  return found;
}
