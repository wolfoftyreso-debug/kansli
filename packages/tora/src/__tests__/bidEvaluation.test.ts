/**
 * Anbudsutvärderingen.
 *
 * Två sorters påståenden prövas här, och de har olika kravnivå.
 *
 * Aritmetiken ska stämma exakt: en poäng som är fel med två enheter är fel på
 * ett sätt ett företag agerar på. Den prövas mot handräknade tal.
 *
 * Vägran att räkna ska bita *överallt* där en avgörande uppgift saknas. Det är
 * den egenskap som gör räknaren värd att lita på: en modell utan formel, ett
 * relativt anbud utan antagande, en mervärdesmodell utan kvalitetspoäng — alla
 * ska ge `unknown` med det som fattas utskrivet, aldrig en siffra som ser exakt
 * ut.
 */

import { describe, expect, it } from "vitest";

import { evaluateBid, type BidEvaluation } from "../engine/bidEvaluation";
import type { EvaluationModel } from "../domain/ontology";

const PRICE_ONLY = [{ name: "Pris", weightPct: 100 }];
const PRICE_AND_QUALITY = [
  { name: "Pris", weightPct: 60 },
  { name: "Kvalitet och organisation", weightPct: 40 },
];

/** Snävar av unionen så testet kan läsa fälten utan att kasta typerna. */
function computed(result: BidEvaluation) {
  if (result.status !== "computed") {
    throw new Error(`förväntade en uträkning, fick unknown: ${result.explanation}`);
  }
  return result;
}
function unknown(result: BidEvaluation) {
  if (result.status !== "unknown") {
    throw new Error("förväntade unknown, fick en uträkning");
  }
  return result;
}

/* ------------------------------------------------------------------ */

describe("vägrar räkna när något avgörande saknas", () => {
  it("utan utvärderingsmodell", () => {
    const result = unknown(evaluateBid(undefined, { priceSek: 500_000 }));
    expect(result.missing).toContain("utvärderingsmodell");
  });

  it("utan prisformel, även när viktningen är känd", () => {
    // Det här är demodatans faktiska form: "Pris 60 %" utan ett ord om hur
    // kronor blir poäng. Att gissa den vanligaste modellen vore att uppfinna
    // hälften av svaret.
    const model: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_AND_QUALITY,
    };
    const result = unknown(evaluateBid(model, { priceSek: 500_000 }));
    expect(result.missing).toContain("prisets poängformel");
    // Viktningen vi *har* ska stå i klartext, så svaret inte blir ett tomt nej.
    expect(result.explanation).toContain("60 %");
  });

  it("relativ modell utan antaget lägstapris", () => {
    const model: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_ONLY,
      priceModel: { kind: "relative_to_lowest", maxPoints: 60 },
    };
    const result = unknown(evaluateBid(model, { priceSek: 500_000 }));
    expect(result.missing).toContain("antaget lägsta konkurrerande anbud");
  });

  it("mervärdesmodell utan egen kvalitetspoäng", () => {
    const model: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_AND_QUALITY,
      priceModel: { kind: "quality_as_deduction", sekPerQualityPoint: 10_000 },
    };
    const result = unknown(evaluateBid(model, { priceSek: 500_000 }));
    expect(result.missing).toContain("egen kvalitetspoäng");
  });

  it("fast pris utan egen kvalitetspoäng", () => {
    const model: EvaluationModel = {
      kind: "fixed_price_best_quality",
      criteria: [{ name: "Kvalitet", weightPct: 100 }],
      priceModel: { kind: "fixed_price", priceSek: 800_000 },
    };
    const result = unknown(evaluateBid(model, { priceSek: 800_000 }));
    expect(result.missing).toContain("egen kvalitetspoäng");
  });

  it("ogiltigt anbudspris", () => {
    const model: EvaluationModel = {
      kind: "lowest_price",
      criteria: PRICE_ONLY,
      priceModel: { kind: "lowest_price_wins" },
    };
    expect(unknown(evaluateBid(model, { priceSek: 0 })).missing).toContain("anbudspris");
    expect(unknown(evaluateBid(model, { priceSek: -5 })).missing).toContain("anbudspris");
  });

  it("linjär modell med hopfallet intervall", () => {
    // Varje pris skulle ge samma poäng. Det är en felläsning, inte en kant att
    // tyst hantera.
    const model: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_ONLY,
      priceModel: {
        kind: "linear_between",
        maxPoints: 60,
        bestPriceSek: 500_000,
        worstPriceSek: 500_000,
      },
    };
    expect(unknown(evaluateBid(model, { priceSek: 500_000 })).missing).toContain(
      "giltigt prisintervall",
    );
  });
});

/* ------------------------------------------------------------------ */

describe("linjär prismodell", () => {
  const model: EvaluationModel = {
    kind: "best_price_quality_ratio",
    criteria: PRICE_AND_QUALITY,
    priceModel: {
      kind: "linear_between",
      maxPoints: 60,
      bestPriceSek: 400_000,
      worstPriceSek: 800_000,
    },
  };

  it("räknar mitten av intervallet till halva poängen", () => {
    // (800 000 − 600 000) / (800 000 − 400 000) × 60 = 30
    const result = computed(evaluateBid(model, { priceSek: 600_000 }));
    expect(result.steps[0].value).toBe(30);
  });

  it("ger full poäng vid den bästa gränsen och noll vid den sämsta", () => {
    expect(computed(evaluateBid(model, { priceSek: 400_000 })).steps[0].value).toBe(60);
    expect(computed(evaluateBid(model, { priceSek: 800_000 })).steps[0].value).toBe(0);
  });

  it("kapar i båda ändarna i stället för att ge över max eller under noll", () => {
    const under = computed(evaluateBid(model, { priceSek: 100_000 }));
    expect(under.steps[0].value).toBe(60);
    expect(under.explanation).toContain("kapad");

    const over = computed(evaluateBid(model, { priceSek: 2_000_000 }));
    expect(over.steps[0].value).toBe(0);
  });

  it("är oberoende av konkurrenterna", () => {
    // Gränserna är köparens. Att svaret inte vilar på ett antagande är just det
    // som skiljer den här modellen från den relativa.
    expect(computed(evaluateBid(model, { priceSek: 600_000 })).restsOnAssumption).toBe(false);
  });

  it("summerar inte totalen när kvalitetspoängen saknas", () => {
    // Utelämnad kvalitet är inte noll kvalitet. En total som räknar den som noll
    // vore ett tyst antagande om anbudet.
    const result = computed(evaluateBid(model, { priceSek: 600_000 }));
    expect(result.totalPoints).toBeUndefined();
    expect(result.steps.some((s) => s.label.includes("ej angiven"))).toBe(true);
  });

  it("summerar när kvalitetspoängen är angiven", () => {
    const result = computed(evaluateBid(model, { priceSek: 600_000, qualityPoints: 25 }));
    expect(result.totalPoints).toBe(55);
  });
});

/* ------------------------------------------------------------------ */

describe("relativ prismodell", () => {
  const model: EvaluationModel = {
    kind: "best_price_quality_ratio",
    criteria: PRICE_ONLY,
    priceModel: { kind: "relative_to_lowest", maxPoints: 60 },
  };

  it("räknar lägsta genom eget pris", () => {
    // 400 000 / 500 000 × 60 = 48
    const result = computed(
      evaluateBid(model, { priceSek: 500_000, assumedLowestCompetingPriceSek: 400_000 }),
    );
    expect(result.steps[0].value).toBe(48);
  });

  it("ger inte över maxpoäng när det egna priset är lägst", () => {
    // Utan spärren blir kvoten 600/500 och poängen 72 av 60 — ett tal som ser
    // exakt ut och är omöjligt.
    const result = computed(
      evaluateBid(model, { priceSek: 500_000, assumedLowestCompetingPriceSek: 600_000 }),
    );
    expect(result.steps[0].value).toBe(60);
    expect(result.explanation).toContain("blir då självt det lägsta");
  });

  it("märker ut att svaret vilar på ett antagande", () => {
    const result = computed(
      evaluateBid(model, { priceSek: 500_000, assumedLowestCompetingPriceSek: 400_000 }),
    );
    expect(result.restsOnAssumption).toBe(true);
    expect(result.explanation).toContain("antagande");
  });
});

/* ------------------------------------------------------------------ */

describe("mervärdesmodell", () => {
  const model: EvaluationModel = {
    kind: "best_price_quality_ratio",
    criteria: PRICE_AND_QUALITY,
    priceModel: { kind: "quality_as_deduction", sekPerQualityPoint: 10_000 },
  };

  it("jämför utvärderingspris, inte anbudspris", () => {
    // 900 000 − 20 × 10 000 = 700 000
    const result = computed(evaluateBid(model, { priceSek: 900_000, qualityPoints: 20 }));
    expect(result.evaluationPriceSek).toBe(700_000);
  });

  it("visar att ett dyrare anbud kan bli billigare i utvärderingen", () => {
    // Hela skälet att räkna på modellen: 900 000 med hög kvalitet slår 750 000
    // med låg, och det syns inte förrän avdraget är gjort.
    const dyrt = computed(evaluateBid(model, { priceSek: 900_000, qualityPoints: 20 }));
    const billigt = computed(evaluateBid(model, { priceSek: 750_000, qualityPoints: 2 }));
    expect(dyrt.evaluationPriceSek!).toBeLessThan(billigt.evaluationPriceSek!);
  });
});

/* ------------------------------------------------------------------ */

describe("lägsta pris och fast pris", () => {
  it("lägsta pris poängsätter inte", () => {
    const model: EvaluationModel = {
      kind: "lowest_price",
      criteria: PRICE_ONLY,
      priceModel: { kind: "lowest_price_wins" },
    };
    const result = computed(evaluateBid(model, { priceSek: 450_000 }));
    expect(result.totalPoints).toBeUndefined();
    expect(result.evaluationPriceSek).toBe(450_000);
    expect(result.explanation).toContain("Lägsta pris vinner");
  });

  it("fast pris utvärderar bara kvalitet", () => {
    const model: EvaluationModel = {
      kind: "fixed_price_best_quality",
      criteria: [{ name: "Kvalitet", weightPct: 100 }],
      priceModel: { kind: "fixed_price", priceSek: 800_000 },
    };
    const result = computed(evaluateBid(model, { priceSek: 999_999, qualityPoints: 42 }));
    // Anbudsgivarens pris spelar ingen roll — köparens gör det.
    expect(result.evaluationPriceSek).toBe(800_000);
    expect(result.totalPoints).toBe(42);
  });
});

/* ------------------------------------------------------------------ */

describe("doktrin", () => {
  it("bär förbudet mot prissamordning på varje svar", () => {
    // Räknaren får aldrig bli ett verktyg för att samordna anbud. Doktrinen ska
    // följa med både när det går att räkna och när det inte gör det.
    const withFormula: EvaluationModel = {
      kind: "lowest_price",
      criteria: PRICE_ONLY,
      priceModel: { kind: "lowest_price_wins" },
    };
    const withoutFormula: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_AND_QUALITY,
    };

    for (const result of [
      evaluateBid(withFormula, { priceSek: 450_000 }),
      evaluateBid(withoutFormula, { priceSek: 450_000 }),
      evaluateBid(undefined, { priceSek: 450_000 }),
    ]) {
      expect(result.caveats.map((c) => c.key)).toContain("noPriceCoordination");
    }
  });

  it("föreslår aldrig ett pris", () => {
    // Räknaren svarar på "vad ger det här priset", aldrig på "vad ska jag lägga".
    const model: EvaluationModel = {
      kind: "best_price_quality_ratio",
      criteria: PRICE_ONLY,
      priceModel: {
        kind: "linear_between",
        maxPoints: 60,
        bestPriceSek: 400_000,
        worstPriceSek: 800_000,
      },
    };
    const result = computed(evaluateBid(model, { priceSek: 600_000 }));
    const text = `${result.explanation} ${result.steps.map((s) => s.formula).join(" ")}`;
    expect(text).not.toMatch(/du bör|vi rekommenderar|lägg ett anbud på|föreslår ett pris/i);
  });
});
