/**
 * Vad det kostar att lämna anbud, mot vad det rimligen ger.
 *
 * Två systematiska fel gör att små företag lämnar anbud de förlorar på även när
 * de vinner. Motorn räknar isär dem, och gör det på användarens egna tal.
 *
 * **Anbudskostnaden underskattas.** Timmarna för att läsa underlaget, hämta
 * intyg, skriva svar på kvalitetsfrågor och räkna kalkylen är arbetstid som
 * inte faktureras någon. En vecka är inte ovanligt, och en vecka är riktiga
 * pengar.
 *
 * **Intäkten överskattas.** Att multiplicera vinstchansen med *kontraktsvärdet*
 * är det klassiska felet — man behåller inte kontraktsvärdet, man behåller sin
 * marginal på det. Skillnaden är ofta en tiopotens.
 *
 * Det starkaste talet motorn räknar fram behöver ingen gissning alls:
 * **break even-sannolikheten**. Kostnad delat på marginal säger hur ofta man
 * måste vinna för att anbudsarbetet ska gå jämnt upp. Överstiger den 100 % är
 * saken avgjord av ren aritmetik — då täcker inte ens en garanterad vinst
 * kostnaden att lämna anbudet.
 *
 * Tre gränser gäller genomgående:
 *
 * **Vinstsannolikheten gissas aldrig.** Den beror på konkurrenter ingen känner
 * och anbud som inte lämnats. Systemet räknar på ett antagande användaren gör,
 * och märker ut att svaret vilar på det.
 *
 * **Ingen rekommendation ges.** Motorn heter bid/no-bid efter begreppet, men
 * säger aldrig "lämna" eller "avstå". Den lägger fram aritmetiken; beslutet är
 * företagets, som känner sin beläggning och sina skäl att synas hos en köpare.
 *
 * **Tomt fält är inte noll.** Utan timkostnad finns ingen kostnad att räkna, och
 * svaret blir `unknown` med det som fattas utskrivet — inte en nolla som ser ut
 * som ett gratis anbud.
 */

import { type Caveat, doctrineCaveat } from "../domain/regulations";

/* ------------------------------------------------------------------ */

export interface BidEconomicsInput {
  /** Timmar att ta fram anbudet. Det som oftast underskattas. */
  hours?: number;
  /** Egen kostnad per timme — lön och omkostnader, inte fakturerat pris. */
  hourlyCostSek?: number;
  /** Utlägg: intyg, översättning, referensbesök, provleverans. */
  directCostsSek?: number;
  /**
   * Vad uppdraget är värt över den tid som faktiskt är beslutad.
   *
   * Säkrad tid och inte längsta möjliga: se `contractValue.ts`. Optionsår som
   * ingen beslutat om är inte intäkt att räkna en anbudsinsats mot.
   */
  contractValueSek?: number;
  /** Egen bruttomarginal på uppdraget, i procent. */
  marginPct?: number;
  /** Antagen chans att vinna, i procent. Användarens antagande, aldrig vårt. */
  winProbabilityPct?: number;
}

export interface EconomicsStep {
  label: string;
  formula: string;
  value: number;
  unit: "kr" | "%" | "h";
}

export type BidEconomics =
  | {
      status: "computed";
      bidCostSek: number;
      /** Marginalen på uppdraget, när värde och marginal båda är angivna. */
      contractMarginSek?: number;
      /**
       * Hur ofta man måste vinna för att anbudsarbetet ska gå jämnt upp.
       * Över 100 betyder att inte ens en säker vinst täcker kostnaden.
       */
      breakEvenWinPct?: number;
      /** Förväntat utfall vid den antagna vinstchansen. */
      expectedValueSek?: number;
      steps: EconomicsStep[];
      explanation: string;
      restsOnAssumption: boolean;
      caveats: Caveat[];
    }
  | {
      status: "unknown";
      missing: string[];
      explanation: string;
      caveats: Caveat[];
    };

/* ------------------------------------------------------------------ */

function sek(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

function pct(value: number): string {
  return `${Math.round(value * 10) / 10} %`;
}

const positive = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value > 0;

const nonNegative = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/* ------------------------------------------------------------------ */

export function assessBidEconomics(input: BidEconomicsInput): BidEconomics {
  const caveats: Caveat[] = [doctrineCaveat("noPriceCoordination")];

  // Kostnaden är grunden. Utan den finns ingenting att ställa något mot, och
  // att räkna en oangiven timkostnad som noll vore att påstå att anbudsarbetet
  // är gratis — vilket är exakt den felräkning motorn finns för att rätta.
  //
  // Vakterna binds till lokala konstanter och grinden returnerar direkt.
  // Skrivet som `if (missing.length > 0) return` narrowar TypeScript inte
  // `input.hours` efteråt — kontrollen och returen hänger inte ihop för
  // typsystemet. Det passerade rotens typkontroll, som kör `strict: false`,
  // och fälldes först av tjänstens, som kör strikt mot samma delade fil.
  const hours = input.hours;
  const hourlyCostSek = input.hourlyCostSek;

  const missing: string[] = [];
  if (!positive(hours)) missing.push("timmar för anbudsarbetet");
  if (!positive(hourlyCostSek)) missing.push("din timkostnad");
  if (!positive(hours) || !positive(hourlyCostSek)) {
    return {
      status: "unknown",
      missing,
      explanation:
        "Anbudsarbetet kostar arbetstid som ingen fakturerar. Ange timmar och din timkostnad " +
        "för att se vad det handlar om — det är den siffran som oftast saknas när ett företag " +
        "räknar på en upphandling.",
      caveats,
    };
  }

  const direct = nonNegative(input.directCostsSek) ? input.directCostsSek : 0;
  const labour = hours * hourlyCostSek;
  const bidCostSek = labour + direct;

  const steps: EconomicsStep[] = [
    {
      label: "Arbetstid",
      formula: `${hours} h × ${sek(hourlyCostSek)}`,
      value: Math.round(labour),
      unit: "kr",
    },
  ];
  if (direct > 0) {
    steps.push({ label: "Direkta utlägg", formula: sek(direct), value: direct, unit: "kr" });
  }
  steps.push({
    label: "Anbudet kostar",
    formula: direct > 0 ? `${sek(labour)} + ${sek(direct)}` : sek(labour),
    value: Math.round(bidCostSek),
    unit: "kr",
  });

  // Utan värde och marginal stannar vi vid kostnaden. Det är fortfarande ett
  // svar — och ofta det enda företaget behöver för att inse något.
  if (!positive(input.contractValueSek) || !positive(input.marginPct)) {
    return {
      status: "computed",
      bidCostSek: Math.round(bidCostSek),
      steps,
      explanation:
        `Att lämna det här anbudet kostar ${sek(bidCostSek)} i egen tid och utlägg. ` +
        "Ange uppdragets värde och din marginal för att se hur ofta du behöver vinna för att " +
        "det ska gå jämnt upp.",
      restsOnAssumption: false,
      caveats,
    };
  }

  const contractMarginSek = input.contractValueSek * (input.marginPct / 100);
  steps.push({
    label: "Din marginal på uppdraget",
    formula: `${sek(input.contractValueSek)} × ${input.marginPct} %`,
    value: Math.round(contractMarginSek),
    unit: "kr",
  });

  const breakEvenWinPct = (bidCostSek / contractMarginSek) * 100;
  steps.push({
    label: "Break even — så ofta måste du vinna",
    formula: `${sek(bidCostSek)} ÷ ${sek(contractMarginSek)}`,
    value: Math.round(breakEvenWinPct * 10) / 10,
    unit: "%",
  });

  const parts: string[] = [
    `Anbudet kostar ${sek(bidCostSek)}. Vinner du är marginalen ${sek(contractMarginSek)}.`,
  ];

  if (breakEvenWinPct > 100) {
    // Ren aritmetik, inget omdöme: marginalen räcker inte ens vid säker vinst.
    parts.push(
      "Kostnaden att lämna anbudet överstiger hela marginalen på uppdraget. Även en garanterad " +
        "vinst går back på anbudsarbetet — det följer av talen, inte av någon bedömning.",
    );
  } else {
    parts.push(
      `Det betyder att du behöver vinna ungefär ${pct(breakEvenWinPct)} av likvärdiga ` +
        `upphandlingar — grovt räknat en av ${Math.max(1, Math.round(100 / breakEvenWinPct))} — ` +
        "för att anbudsarbetet ska gå jämnt upp över tid.",
    );
  }

  let expectedValueSek: number | undefined;
  let restsOnAssumption = false;

  if (positive(input.winProbabilityPct)) {
    restsOnAssumption = true;
    const p = Math.min(100, input.winProbabilityPct) / 100;
    expectedValueSek = p * contractMarginSek - bidCostSek;
    steps.push({
      label: "Förväntat utfall",
      formula: `${Math.round(p * 100)} % × ${sek(contractMarginSek)} − ${sek(bidCostSek)}`,
      value: Math.round(expectedValueSek),
      unit: "kr",
    });
    parts.push(
      `Vid din antagna vinstchans på ${Math.round(p * 100)} % blir det förväntade utfallet ` +
        `${sek(expectedValueSek)}. Vinstchansen är ditt antagande — den beror på konkurrenter ` +
        "ingen känner och anbud som ännu inte lämnats.",
    );
  }

  parts.push(
    "Talen säger vad de säger; om anbudet är värt att lämna avgör du. Det kan finnas skäl " +
      "att lämna ett anbud som inte bär sig ensamt — att bli känd hos en köpare, eller att " +
      "positionera sig inför nästa upphandling.",
  );

  return {
    status: "computed",
    bidCostSek: Math.round(bidCostSek),
    contractMarginSek: Math.round(contractMarginSek),
    breakEvenWinPct: Math.round(breakEvenWinPct * 10) / 10,
    expectedValueSek: expectedValueSek === undefined ? undefined : Math.round(expectedValueSek),
    steps,
    explanation: parts.join(" "),
    restsOnAssumption,
    caveats,
  };
}
