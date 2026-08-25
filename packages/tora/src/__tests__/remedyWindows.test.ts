/**
 * Rättsmedlen och deras frister.
 *
 * Aritmetiken är enkel: lägg tio dagar, sex månader eller ett år till ett
 * datum. Det som prövas hårdare är de gränser som gör skillnad mellan hjälp och
 * skada, och de är fler här än någon annanstans i systemet:
 *
 *   saknat datum      ≠  gissad slutdag
 *   approximerat      ≠  fastställt
 *   öppen väg         ≠  grund för talan
 *   information       ≠  råd om att processa
 *
 * Den tredje är den farligaste. Ett verktyg som säger "avtalsspärren löper i
 * fyra dagar till" ligger nära att låta som "du bör överklaga", och det får det
 * inte göra — om något gått fel avgörs av ett underlag systemet inte har läst.
 */

import { describe, expect, it } from "vitest";

import { ANCHOR_LABEL, COURT_LABEL, REMEDIES, remedy } from "../domain/remedies";
import type { Award, ProcurementGraph } from "../domain/ontology";
import { buildRemedyOutlook, CLOSING_SOON_DAYS } from "../engine/remedyWindows";

/* ------------------------------------------------------------------ */

function graph(awards: Award[] = []): ProcurementGraph {
  return {
    organizations: [],
    procurements: [],
    contracts: [],
    awards,
    suppliers: [],
  } as unknown as ProcurementGraph;
}

function award(awardedAt: string, overrides: Partial<Award> = {}): Award {
  return {
    id: "a1",
    procurementId: "p1",
    supplierName: "Någon annan AB",
    awardedAt,
    sources: [],
    ...overrides,
  } as Award;
}

const win = (result: ReturnType<typeof buildRemedyOutlook>, key: string) => {
  const found = result.windows.find((w) => w.remedy.key === key);
  if (!found) throw new Error(`fönstret ${key} saknas`);
  return found;
};

/* ------------------------------------------------------------------ */

describe("avtalsspärren räknas mot tilldelningen", () => {
  it("lägger tio dagar till tilldelningsdatumet", () => {
    const result = buildRemedyOutlook("p1", graph([award("2026-08-20")]), "2026-08-22");
    const w = win(result, "review_procurement");
    expect(w.closesOn).toBe("2026-08-30");
    expect(w.daysLeft).toBe(8);
    expect(w.state).toBe("open");
  });

  it("markerar en spärr som håller på att stänga", () => {
    // Åtta dagar in i en tiodagarsspärr: två dagar kvar.
    const result = buildRemedyOutlook("p1", graph([award("2026-08-14")]), "2026-08-22");
    const w = win(result, "review_procurement");
    expect(w.daysLeft).toBe(2);
    expect(w.daysLeft).toBeLessThanOrEqual(CLOSING_SOON_DAYS);
    expect(w.state).toBe("closing_soon");
    expect(result.summary).toContain("stänger");
  });

  it("markerar en passerad spärr som stängd", () => {
    const result = buildRemedyOutlook("p1", graph([award("2026-07-01")]), "2026-08-22");
    const w = win(result, "review_procurement");
    expect(w.state).toBe("closed");
    expect(w.daysLeft).toBeLessThan(0);
    expect(result.summary).toContain("har passerat");
  });

  it("räknar sista dagen som öppen och inte som passerad", () => {
    // Fristen löper ut den tionde dagen; den dagen är ansökan fortfarande i tid.
    const result = buildRemedyOutlook("p1", graph([award("2026-08-12")]), "2026-08-22");
    const w = win(result, "review_procurement");
    expect(w.closesOn).toBe("2026-08-22");
    expect(w.daysLeft).toBe(0);
    expect(w.state).not.toBe("closed");
  });
});

/* ------------------------------------------------------------------ */

describe("ett datum vi bara approximerar sägs vara approximerat", () => {
  it("märker tilldelningsdatumet som en approximation av utskicksdagen", () => {
    // Spärren löper från dagen underrättelsen skickades. Vi har dagen
    // tilldelningen skedde. Ofta samma dag — men en dags fel är skillnaden
    // mellan en prövning och ingen.
    const w = win(
      buildRemedyOutlook("p1", graph([award("2026-08-20")]), "2026-08-22"),
      "review_procurement",
    );
    expect(w.anchorCertainty).toBe("approximated");
    expect(w.basis).toContain("inte utskicksdagen");
    expect(w.basis).toContain("ditt besked");
  });

  it("skriver ut vilket datum uträkningen vilar på", () => {
    const w = win(
      buildRemedyOutlook("p1", graph([award("2026-08-20")]), "2026-08-22"),
      "review_procurement",
    );
    expect(w.anchorDate).toBe("2026-08-20");
    expect(w.basis).toContain("2026-08-20");
    expect(w.basis).toContain(ANCHOR_LABEL.award_notice_sent);
  });
});

/* ------------------------------------------------------------------ */

describe("utan ankardatum räknas ingenting", () => {
  it("räknar ingen slutdag för avtalets giltighet", () => {
    // Dagen avtalet slöts modelleras inte. Att använda kontraktets startdatum
    // vore att uppfinna ett datum och sedan räkna sex månader från det.
    const w = win(
      buildRemedyOutlook("p1", graph([award("2026-08-20")]), "2026-08-22"),
      "contract_validity",
    );
    expect(w.state).toBe("unknown");
    expect(w.closesOn).toBeUndefined();
    expect(w.daysLeft).toBeUndefined();
    expect(w.anchorCertainty).toBe("missing");
  });

  it("redovisar regeln i stället för en gissad dag", () => {
    const w = win(buildRemedyOutlook("p1", graph([award("2026-08-20")]), "2026-08-22"), "damages");
    expect(w.basis).toContain("Fristen gäller ändå");
    expect(w.remedy.deadline.rule).toContain("ett år");
  });

  it("svarar unknown för alla vägar när ingen tilldelning finns", () => {
    const result = buildRemedyOutlook("p1", graph([]), "2026-08-22");
    expect(result.windows.every((w) => w.state === "unknown")).toBe(true);
    expect(result.windows.every((w) => w.closesOn === undefined)).toBe(true);
  });

  it("hämtar bara tilldelningen för rätt upphandling", () => {
    const result = buildRemedyOutlook(
      "p1",
      graph([award("2026-08-20", { id: "a2", procurementId: "p2" })]),
      "2026-08-22",
    );
    expect(win(result, "review_procurement").state).toBe("unknown");
  });
});

/* ------------------------------------------------------------------ */

describe("informerar, rekommenderar inte", () => {
  const cases = [
    graph([award("2026-08-20")]),
    graph([award("2026-08-14")]),
    graph([award("2026-07-01")]),
    graph([]),
  ];

  it.each(cases.map((g, i) => [i, g] as const))(
    "ger aldrig ett råd om att processa (%i)",
    (_, g) => {
      const result = buildRemedyOutlook("p1", g, "2026-08-22");
      const text = `${result.summary} ${result.windows.map((w) => w.basis).join(" ")}`;
      expect(text).not.toMatch(
        /du bör (ansöka|överklaga|överpröva)|vi rekommenderar|du har grund|det finns grund|du kan vinna/i,
      );
    },
  );

  it("säger rakt ut att den inte bedömer om något gått fel", () => {
    const result = buildRemedyOutlook("p1", graph([award("2026-08-14")]), "2026-08-22");
    expect(result.summary).toContain("bedömer inte om något gått fel");
  });

  it("säger vad varje väg inte kan ge", () => {
    // Den vanligaste felföreställningen: att en vunnen överprövning ger dig
    // uppdraget. Den gör den inte.
    expect(remedy("review_procurement").cannot).toContain("tilldelar aldrig kontraktet till dig");
    expect(remedy("contract_validity").cannot).toContain("ger inte dig uppdraget");
    expect(remedy("damages").cannot).toContain("påverkar inte avtalet");
  });
});

/* ------------------------------------------------------------------ */

describe("katalogen över rättsmedel", () => {
  it("har källa och kontrollflagga på varje frist", () => {
    for (const r of REMEDIES) {
      expect(r.deadline.source.document, r.key).toBeTruthy();
      expect(r.deadline.source.retrievedAt, r.key).toBeTruthy();
      expect(["verified", "unverified"]).toContain(r.deadline.verification);
      expect(["verified", "unverified"]).toContain(r.costVerification);
    }
  });

  it("skiljer på förvaltningsdomstol och allmän domstol", () => {
    // Att gå till fel domstol är att förlora fristen medan man väntar på svar.
    expect(remedy("review_procurement").court).toBe("administrative");
    expect(remedy("contract_validity").court).toBe("administrative");
    expect(remedy("damages").court).toBe("general");
    expect(COURT_LABEL.general).toContain("Tingsrätten");
  });

  it("säger vad överprövning kostar, eftersom svaret överraskar", () => {
    // Föreställningen att man riskerar köparens ombudskostnader håller fler
    // borta från domstol än något annat. I förvaltningsdomstol står vardera
    // parten för sina egna.
    const r = remedy("review_procurement");
    expect(r.cost).toContain("Ingen ansökningsavgift");
    expect(r.cost).toContain("egna kostnader");
  });

  it("varnar för att skadestånd har en annan riskbild", () => {
    // Samma slutsats får inte dras för skadestånd: där gäller vanliga
    // civilprocessregler, och den som förlorar kan få betala motparten.
    expect(remedy("damages").cost).toContain("rättegångskostnader");
  });

  it("skiljer de två ankardatumen åt", () => {
    expect(remedy("review_procurement").deadline.anchor).toBe("award_notice_sent");
    expect(remedy("contract_validity").deadline.anchor).toBe("contract_concluded");
    expect(remedy("damages").deadline.anchor).toBe("contract_concluded");
    expect(ANCHOR_LABEL.award_notice_sent).not.toBe(ANCHOR_LABEL.contract_concluded);
  });

  it("säger att ansökan ska ha kommit in, inte skickats", () => {
    expect(remedy("review_procurement").pitfall).toContain("kommit in");
    expect(remedy("review_procurement").pitfall).toContain("skickats i tid räcker inte");
  });

  it("kastar på en okänd nyckel i stället för att svara tomt", () => {
    expect(() => remedy("hittepå" as never)).toThrow(/okänt rättsmedel/);
  });
});
