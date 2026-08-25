/**
 * Kontraktsvärdet.
 *
 * Det som prövas här är inte att aritmetiken går ihop — det gör den lätt — utan
 * att motorn håller isär tre saker som ett företag annars blandar ihop, och
 * varje sammanblandning kostar pengar:
 *
 *   säkrad tid          ≠  längsta möjliga tid
 *   avtalets värde      ≠  din intäkt
 *   antagen i ramavtal  ≠  garanterad volym
 *
 * Den sista är den dyraste, och därför den enda som testas som doktrin och inte
 * bara som text.
 */

import { describe, expect, it } from "vitest";

import {
  assessContractValue,
  assessProcurementValue,
  monthsBetween,
  termMonths,
} from "../engine/contractValue";
import { demoGraph } from "../data/seed";
import type { Contract, Procurement } from "../domain/ontology";

const contract = (id: string): Contract => {
  const found = demoGraph.contracts.find((c) => c.id === id);
  if (!found) throw new Error(`saknar avtal ${id}`);
  return found;
};

const procurement = (id: string): Procurement => {
  const found = demoGraph.procurements.find((p) => p.id === id);
  if (!found) throw new Error(`saknar upphandling ${id}`);
  return found;
};

/* ------------------------------------------------------------------ */

describe("månader mellan datum", () => {
  it("räknar hela månader", () => {
    expect(monthsBetween("2027-01-01", "2031-01-01")).toBe(48);
    expect(monthsBetween("2027-01-01", "2027-07-01")).toBe(6);
  });

  it("räknar inte en påbörjad månad som hel", () => {
    // 2027-01-15 till 2027-02-14 är inte en hel månad.
    expect(monthsBetween("2027-01-15", "2027-02-14")).toBe(0);
    expect(monthsBetween("2027-01-15", "2027-02-15")).toBe(1);
  });

  it("behandlar ett avtals slutdatum som inklusive", () => {
    // Det här är skillnaden mellan att skriva "fyra år" och "47 månader" om
    // exakt samma avtal. Slutdatumet räknas med — så gör varje annons, och så
    // läser varje människa det.
    expect(termMonths("2027-01-01", "2030-12-31")).toBe(48);
    expect(monthsBetween("2027-01-01", "2030-12-31")).toBe(47);
  });
});

/* ------------------------------------------------------------------ */

describe("säkrad tid skiljs från möjlig", () => {
  const base: Contract = {
    id: "c:test",
    organizationId: "org:test",
    title: "Test",
    capabilities: [],
    cpvCodes: [],
    areas: [],
    startDate: "2027-01-01",
    endDate: "2029-01-01",
    options: [],
    sources: [],
  };

  it("räknar en outnyttjad option som möjlig, inte som säkrad", () => {
    // 2+1+1: två år är beslutade, resten är någon annans beslut. Att räkna dem
    // som intäkt är hur ett företag anställer för år som aldrig kommer.
    const result = assessContractValue({
      ...base,
      options: [{ extensionMonths: 12 }, { extensionMonths: 12 }],
    });
    expect(result.baseMonths).toBe(24);
    expect(result.securedMonths).toBe(24);
    expect(result.maximumMonths).toBe(48);
    expect(result.undecidedOptionMonths).toBe(24);
    expect(result.explanation).toContain("inte säkrad intäkt");
  });

  it("flyttar en utnyttjad option till säkrad tid", () => {
    const result = assessContractValue({
      ...base,
      options: [{ extensionMonths: 12, exercised: true }, { extensionMonths: 12 }],
    });
    expect(result.securedMonths).toBe(36);
    expect(result.maximumMonths).toBe(48);
    expect(result.exercisedOptionMonths).toBe(12);
  });

  it("räknar bort en option som tackats nej till", () => {
    const result = assessContractValue({
      ...base,
      options: [{ extensionMonths: 12, exercised: false }],
    });
    expect(result.securedMonths).toBe(24);
    expect(result.maximumMonths).toBe(24);
    expect(result.declinedOptionMonths).toBe(12);
  });

  it("slår ut årstakten på säkrad tid, inte på längsta möjliga", () => {
    // 4 MSEK över två säkrade år är 2 MSEK per år. Slås samma summa ut över
    // fyra möjliga år blir svaret 1 MSEK — och den som räknar så tror att
    // uppdraget går ihop till halva bemanningen.
    const result = assessContractValue({
      ...base,
      valueSek: 4_000_000,
      options: [{ extensionMonths: 24 }],
    });
    expect(result.annualValueSek).toBe(2_000_000);
  });
});

/* ------------------------------------------------------------------ */

describe("ramavtal delas och garanterar inget", () => {
  const framework: Contract = {
    id: "c:ram",
    organizationId: "org:test",
    title: "Ramavtal",
    capabilities: [],
    cpvCodes: [],
    areas: [],
    startDate: "2027-01-01",
    endDate: "2031-01-01",
    options: [],
    valueSek: 20_000_000,
    isFramework: true,
    callOffMethod: "rank",
    frameworkRankings: [
      { supplierId: "sup:a", rank: 1 },
      { supplierId: "sup:b", rank: 2 },
      { supplierId: "sup:c", rank: 3 },
    ],
    sources: [],
  };

  it("bär doktrinen om att volym inte är garanterad", () => {
    const result = assessContractValue(framework);
    expect(result.caveats.map((c) => c.key)).toContain("frameworkGuaranteesNoVolume");
    expect(result.caveats.map((c) => c.key)).toContain("announcedValueIsNotYourRevenue");
  });

  it("ger aldrig en andel i kronor", () => {
    // 20 miljoner delat på tre leverantörer vore ett tal som ser exakt ut och
    // vilar på ingenting: volymen beror på beställningar som ännu inte lagts.
    const result = assessContractValue(framework, "sup:a");
    expect(result.yourShare.status).toBe("ranked");
    const text = JSON.stringify(result.yourShare);
    expect(text).not.toMatch(/\d[\d\s]*kr/);
  });

  it("säger vad rangordningsplatsen betyder", () => {
    const first = assessContractValue(framework, "sup:a");
    const third = assessContractValue(framework, "sup:c");
    expect(first.yourShare.explanation).toContain("först");
    expect(first.yourShare.explanation).toContain("garanterar ingen volym");
    expect(third.yourShare.explanation).toContain("tackat nej");
  });

  it("beskriver förnyad konkurrensutsättning som en tävling per avrop", () => {
    const result = assessContractValue({ ...framework, callOffMethod: "renewed_competition" });
    expect(result.yourShare.status).toBe("competed");
    expect(result.yourShare.explanation).toContain("egen tävling");
  });

  it("svarar okänt när avropsordningen inte är känd", () => {
    const result = assessContractValue({ ...framework, callOffMethod: undefined });
    expect(result.yourShare.status).toBe("unknown");
  });

  it("ger hela värdet till ett enskilt kontrakt", () => {
    const result = assessContractValue({ ...framework, isFramework: false });
    expect(result.yourShare.status).toBe("whole");
    // Doktrinen om delat värde hör inte hemma på ett kontrakt med en leverantör.
    expect(result.caveats.map((c) => c.key)).not.toContain("frameworkGuaranteesNoVolume");
  });
});

/* ------------------------------------------------------------------ */

describe("annonserad upphandling", () => {
  it("räknar om totalvärdet till årstakt", () => {
    // Nacka: 14 MSEK över 2027-01-01–2030-12-31, alltså fyra år.
    const nacka = procurement("proc:nacka-elservice");
    const result = assessProcurementValue(nacka);
    expect(result.baseMonths).toBe(48);
    expect(result.annualValueSek).toBeCloseTo(3_500_000, 0);
    expect(result.explanation).toContain("avser hela avtalstiden");
  });

  it("räknar ingen årstakt utan avtalstid", () => {
    const utanTid: Procurement = {
      ...procurement("proc:nacka-elservice"),
      contractStart: undefined,
      contractEnd: undefined,
    };
    const result = assessProcurementValue(utanTid);
    expect(result.annualValueSek).toBeUndefined();
    expect(result.explanation).toContain("inte publicerad");
  });

  it("räknar ingen årstakt utan publicerat värde", () => {
    const utanVärde: Procurement = {
      ...procurement("proc:nacka-elservice"),
      estimatedValueSek: undefined,
    };
    const result = assessProcurementValue(utanVärde);
    expect(result.annualValueSek).toBeUndefined();
    expect(result.totalValueSek).toBeUndefined();
    expect(result.explanation).toContain("inte publicerat");
    // Utan värde finns inget att missförstå, så doktrinen om annonsvärdet
    // hör inte hit.
    expect(result.caveats.map((c) => c.key)).not.toContain("announcedValueIsNotYourRevenue");
  });

  it("säger att ett avrop inte avgörs av annonsvärdet", () => {
    const avrop = procurement("proc:tyresobostader-avrop-hiss");
    const result = assessProcurementValue(avrop);
    expect(result.yourShare.status).toBe("unknown");
    expect(result.yourShare.explanation).toContain("avropsordning");
    expect(result.caveats.map((c) => c.key)).toContain("frameworkGuaranteesNoVolume");
  });
});
