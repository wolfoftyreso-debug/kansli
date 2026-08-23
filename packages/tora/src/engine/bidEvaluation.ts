/**
 * Anbudsutvärdering: vad köparens egen modell ger vid ett visst pris.
 *
 * Det här är en räknare, inte en rådgivare. Skillnaden är hela poängen och
 * syns i tre val:
 *
 * **Systemet föreslår aldrig ett pris.** Doktrinen `noPriceCoordination` gäller
 * här precis som i prisanalysen: uppgifterna är offentliga och historiska, och
 * de får inte bli ett verktyg för att samordna anbud. Användaren anger ett pris
 * och får veta vad *köparens publicerade formel* gör med det. Vill någon veta
 * vilket pris som ger vilken poäng provar de sig fram — det är deras beslut och
 * deras affär, och den skillnaden är inte kosmetisk.
 *
 * **Utan formel räknas ingenting.** "Pris 60 %" säger vad priset väger, inte hur
 * kronor blir poäng. Två anbud med samma pris och samma vikt får olika poäng
 * under relativ modell och linjär modell. Saknas `priceModel` svarar motorn
 * `unknown` och säger vilken uppgift som fattas — samma hållning som mot en
 * overifierad tröskel: där talet avgör svaret finns inget svar att ge.
 *
 * **Ett antagande om konkurrenterna är användarens, inte systemets.** Relativa
 * modeller beror på det lägsta inkomna anbudet, som ingen kan veta i förväg.
 * Motorn räknar gärna på ett antaget lägstapris, men bara ett som någon matat
 * in, och svaret bär då att det vilar på antagandet.
 */

import type { EvaluationModel, PriceEvaluationModel } from "../domain/ontology";
import { type Caveat, doctrineCaveat } from "../domain/regulations";

/* ------------------------------------------------------------------ */

export interface BidInput {
  /** Anbudssumman användaren vill pröva, i kronor. */
  priceSek: number;
  /**
   * Egen bedömd kvalitetspoäng. En bedömning användaren gör om sitt eget anbud,
   * inte något systemet kan härleda.
   */
  qualityPoints?: number;
  /**
   * Antaget lägsta konkurrerande anbud, i kronor. Krävs av relativa modeller
   * och är alltid ett antagande — ingen vet vad andra lämnar.
   */
  assumedLowestCompetingPriceSek?: number;
}

/** En rad i uträkningen, så att varje tal går att följa till sin formel. */
export interface CalculationStep {
  label: string;
  /** Formeln i klartext, med de tal som faktiskt användes. */
  formula: string;
  value: number;
  unit: "poäng" | "kr";
}

export type BidEvaluation =
  | {
      status: "computed";
      /** Poängen anbudet får, när modellen ger poäng. */
      totalPoints?: number;
      /** Det belopp som faktiskt jämförs, när modellen jämför kronor. */
      evaluationPriceSek?: number;
      steps: CalculationStep[];
      explanation: string;
      /** `true` när svaret vilar på ett antagande om konkurrenternas pris. */
      restsOnAssumption: boolean;
      caveats: Caveat[];
    }
  | {
      status: "unknown";
      /** Vad som saknas för att kunna räkna, i klartext. */
      missing: string[];
      explanation: string;
      caveats: Caveat[];
    };

/* ------------------------------------------------------------------ */

/** Vikten för kriteriet som avser pris, när modellen anger den. */
function priceWeightPct(model: EvaluationModel): number | undefined {
  const priceCriterion = model.criteria.find((c) => /pris/i.test(c.name));
  return priceCriterion?.weightPct;
}

function sek(value: number): string {
  return `${Math.round(value).toLocaleString("sv-SE")} kr`;
}

/** Avrundning till två decimaler, så att en poäng inte visas med sexton. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/* ------------------------------------------------------------------ */

/**
 * Räknar ut vad köparens modell ger för det angivna anbudet.
 *
 * Returnerar `unknown` hellre än en siffra så snart en uppgift som *avgör*
 * resultatet saknas.
 */
export function evaluateBid(model: EvaluationModel | undefined, input: BidInput): BidEvaluation {
  const noCoordination = doctrineCaveat("noPriceCoordination");

  if (!model) {
    return {
      status: "unknown",
      missing: ["utvärderingsmodell"],
      explanation:
        "Underlaget innehåller ingen utvärderingsmodell i systemet, så det går inte att " +
        "räkna på vad ett anbud skulle ge. Läs tilldelningskriterierna i förfrågningsunderlaget.",
      caveats: [noCoordination],
    };
  }

  if (!Number.isFinite(input.priceSek) || input.priceSek <= 0) {
    return {
      status: "unknown",
      missing: ["anbudspris"],
      explanation: "Ange ett anbudspris större än noll för att räkna.",
      caveats: [noCoordination],
    };
  }

  const priceModel = model.priceModel;
  if (!priceModel) {
    const weight = priceWeightPct(model);
    return {
      status: "unknown",
      missing: ["prisets poängformel"],
      explanation:
        (weight !== undefined
          ? `Underlaget anger att priset väger ${weight} %, men inte hur kronor blir poäng. `
          : "Underlaget anger inte hur anbudspriset blir poäng. ") +
        "Samma pris ger olika poäng under en relativ och en linjär modell, så utan formeln " +
        "finns inget att räkna. Leta efter avsnittet om prisutvärdering i " +
        "förfrågningsunderlaget.",
      caveats: [noCoordination],
    };
  }

  return byPriceModel(priceModel, model, input, noCoordination);
}

function byPriceModel(
  priceModel: PriceEvaluationModel,
  model: EvaluationModel,
  input: BidInput,
  noCoordination: Caveat,
): BidEvaluation {
  switch (priceModel.kind) {
    /* -------------------------------------------------------------- */
    case "lowest_price_wins": {
      // Ingen poängsättning sker. Att räkna fram en poäng vore att uppfinna en
      // modell köparen inte använder — det enda sanna att säga är vad som
      // faktiskt avgör.
      return {
        status: "computed",
        evaluationPriceSek: input.priceSek,
        steps: [
          {
            label: "Utvärderingspris",
            formula: `anbudspris ${sek(input.priceSek)}`,
            value: input.priceSek,
            unit: "kr",
          },
        ],
        explanation:
          "Lägsta pris vinner. Kvalitet poängsätts inte utan prövas som skallkrav, så " +
          "anbudspriset är det enda som jämförs. Vilket pris som räcker beror på de andra " +
          "anbuden och går inte att veta i förväg.",
        restsOnAssumption: false,
        caveats: [noCoordination],
      };
    }

    /* -------------------------------------------------------------- */
    case "fixed_price": {
      // Priset är köparens, inte anbudsgivarens. Det enda som utvärderas är
      // kvaliteten, och den kan bara komma från användarens egen bedömning.
      const steps: CalculationStep[] = [
        {
          label: "Fast pris satt av köparen",
          formula: sek(priceModel.priceSek),
          value: priceModel.priceSek,
          unit: "kr",
        },
      ];
      if (input.qualityPoints === undefined) {
        return {
          status: "unknown",
          missing: ["egen kvalitetspoäng"],
          explanation:
            `Köparen har fastställt priset till ${sek(priceModel.priceSek)}, så enbart ` +
            "kvaliteten utvärderas. Ange din egna bedömda kvalitetspoäng för att räkna.",
          caveats: [noCoordination],
        };
      }
      steps.push({
        label: "Kvalitetspoäng",
        formula: `egen bedömning ${round2(input.qualityPoints)}`,
        value: round2(input.qualityPoints),
        unit: "poäng",
      });
      return {
        status: "computed",
        totalPoints: round2(input.qualityPoints),
        evaluationPriceSek: priceModel.priceSek,
        steps,
        explanation:
          "Priset är fastställt av köparen och kan inte konkurreras med. Det som avgör är " +
          "kvaliteten, och poängen ovan är din egen bedömning — inte en bedömning systemet gjort.",
        restsOnAssumption: false,
        caveats: [noCoordination],
      };
    }

    /* -------------------------------------------------------------- */
    case "linear_between": {
      const { maxPoints, bestPriceSek, worstPriceSek } = priceModel;
      if (!(worstPriceSek > bestPriceSek)) {
        // En intervallmodell där gränserna inte är åtskilda är felläst, inte en
        // kant att hantera tyst: varje pris skulle ge samma poäng.
        return {
          status: "unknown",
          missing: ["giltigt prisintervall"],
          explanation:
            "Prisintervallet i modellen är ogiltigt — den övre gränsen måste vara högre än " +
            "den undre. Kontrollera hur intervallet står i underlaget.",
          caveats: [noCoordination],
        };
      }

      // Utanför intervallet klipps poängen. Det är modellens egen mekanik: ett
      // pris under den bästa gränsen ger inte mer än full poäng, och ett över
      // den sämsta ger inte minuspoäng.
      const raw = ((worstPriceSek - input.priceSek) / (worstPriceSek - bestPriceSek)) * maxPoints;
      const points = round2(Math.max(0, Math.min(maxPoints, raw)));

      const steps: CalculationStep[] = [
        {
          label: "Prispoäng",
          formula:
            `(${sek(worstPriceSek)} − ${sek(input.priceSek)}) ÷ ` +
            `(${sek(worstPriceSek)} − ${sek(bestPriceSek)}) × ${maxPoints}`,
          value: points,
          unit: "poäng",
        },
      ];

      const total = withQuality(points, input, steps, model);
      return {
        status: "computed",
        totalPoints: total,
        steps,
        explanation:
          `Prispoängen faller linjärt från ${maxPoints} vid ${sek(bestPriceSek)} till noll vid ` +
          `${sek(worstPriceSek)}. Gränserna är köparens, så uträkningen är oberoende av vad ` +
          "andra lämnar för anbud." +
          (input.priceSek < bestPriceSek
            ? ` Priset ligger under den bästa gränsen; poängen är kapad till ${maxPoints}.`
            : "") +
          (input.priceSek > worstPriceSek ? " Priset ligger över den sämsta gränsen: noll poäng." : ""),
        restsOnAssumption: false,
        caveats: [noCoordination],
      };
    }

    /* -------------------------------------------------------------- */
    case "relative_to_lowest": {
      const lowest = input.assumedLowestCompetingPriceSek;
      if (lowest === undefined || !Number.isFinite(lowest) || lowest <= 0) {
        return {
          status: "unknown",
          missing: ["antaget lägsta konkurrerande anbud"],
          explanation:
            "Prispoängen sätts i förhållande till det lägsta inkomna anbudet, som ingen kan " +
            "veta innan anbuden öppnats. Ange ett antaget lägstapris om du vill se vad modellen " +
            "ger — antagandet är ditt, och svaret gäller bara om det stämmer.",
          caveats: [noCoordination],
        };
      }

      // Det egna priset kan självt vara det lägsta. Då är kvoten 1 och poängen
      // full — att räkna lägsta/eget rakt av skulle ge över maxpoäng.
      const effectiveLowest = Math.min(lowest, input.priceSek);
      const points = round2((effectiveLowest / input.priceSek) * priceModel.maxPoints);

      const steps: CalculationStep[] = [
        {
          label: "Prispoäng",
          formula: `${sek(effectiveLowest)} ÷ ${sek(input.priceSek)} × ${priceModel.maxPoints}`,
          value: points,
          unit: "poäng",
        },
      ];

      const total = withQuality(points, input, steps, model);
      return {
        status: "computed",
        totalPoints: total,
        steps,
        explanation:
          `Prispoängen sätts i förhållande till lägsta anbud. Uträkningen vilar på ditt antagande ` +
          `att lägsta konkurrerande anbud är ${sek(lowest)}` +
          (effectiveLowest === input.priceSek && lowest > input.priceSek
            ? " — ditt eget pris är lägre än så, och blir då självt det lägsta."
            : ".") +
          " Lämnar någon ett lägre anbud sjunker poängen, utan att något i ditt anbud ändrats.",
        restsOnAssumption: true,
        caveats: [noCoordination],
      };
    }

    /* -------------------------------------------------------------- */
    case "quality_as_deduction": {
      // Mervärdesmodellen jämför inte anbudspris utan utvärderingspris. Det är
      // hela skälet att räkna på den: ett dyrare anbud kan vinna, och det syns
      // inte förrän avdraget är gjort.
      if (input.qualityPoints === undefined) {
        return {
          status: "unknown",
          missing: ["egen kvalitetspoäng"],
          explanation:
            "Modellen räknar om kvalitetspoäng till kronor och drar av dem från anbudspriset. " +
            "Ange din egna bedömda kvalitetspoäng för att se utvärderingspriset.",
          caveats: [noCoordination],
        };
      }
      const deduction = input.qualityPoints * priceModel.sekPerQualityPoint;
      const evaluationPrice = input.priceSek - deduction;

      return {
        status: "computed",
        evaluationPriceSek: Math.round(evaluationPrice),
        steps: [
          {
            label: "Mervärde",
            formula: `${round2(input.qualityPoints)} poäng × ${sek(priceModel.sekPerQualityPoint)}`,
            value: Math.round(deduction),
            unit: "kr",
          },
          {
            label: "Utvärderingspris",
            formula: `${sek(input.priceSek)} − ${sek(deduction)}`,
            value: Math.round(evaluationPrice),
            unit: "kr",
          },
        ],
        explanation:
          `Kvaliteten räknas om till ${sek(deduction)} i avdrag, så anbudet jämförs som ` +
          `${sek(evaluationPrice)} och inte som ${sek(input.priceSek)}. Det är utvärderingspriset ` +
          "som ställs mot de andra anbuden — därför kan ett dyrare anbud vinna. Kvalitetspoängen " +
          "är din egen bedömning.",
        restsOnAssumption: false,
        caveats: [noCoordination],
      };
    }
  }
}

/**
 * Lägger till kvalitetspoängen när användaren angett den.
 *
 * Utelämnad kvalitet är inte noll kvalitet. Att summera prispoängen ensam och
 * kalla den totalen vore att påstå att anbudet får noll på allt annat, vilket
 * är precis den sortens tyst antagande produkten inte gör någon annanstans
 * heller. Steget märks därför ut som ofullständigt i stället.
 */
function withQuality(
  pricePoints: number,
  input: BidInput,
  steps: CalculationStep[],
  model: EvaluationModel,
): number | undefined {
  if (input.qualityPoints === undefined) {
    steps.push({
      label: "Kvalitetspoäng — ej angiven",
      formula: "din egen bedömning saknas, så totalen kan inte summeras",
      value: 0,
      unit: "poäng",
    });
    return undefined;
  }
  const quality = round2(input.qualityPoints);
  steps.push({
    label: "Kvalitetspoäng",
    formula: `egen bedömning ${quality}` + (model.qualityPointsMax ? ` av ${model.qualityPointsMax}` : ""),
    value: quality,
    unit: "poäng",
  });
  const total = round2(pricePoints + quality);
  steps.push({
    label: "Summa",
    formula: `${pricePoints} + ${quality}`,
    value: total,
    unit: "poäng",
  });
  return total;
}
