/**
 * Kapacitetsplanen.
 *
 * Regeln som prövas är den som oftast avgör om ett litet företag kan delta
 * alls: ett krav du inte klarar ensam behöver inte vara ett stopp. Ett verktyg
 * som lär ut den slarvigt gör dock mer skada än nytta, så fyra gränser prövas
 * hårdare än aritmetiken:
 *
 *   möjlig att låna   ≠  alltid möjlig
 *   oklart            ≠  nej
 *   åberopad kapacitet ≠ underleverantör
 *   ett åtagande      ≠  en underskrift
 *
 * Den sista är den som kan kosta någon annan pengar. Gäller den åberopade
 * kapaciteten ekonomisk ställning får köparen kräva solidariskt ansvar, och
 * den som blir tillfrågad ska få veta det innan de svarar.
 */

import { describe, expect, it } from "vitest";

import { BRIDGE_RULES, bridgeRule, CAPACITY_JOINT_LIABILITY } from "../domain/capacity";
import type { RequirementKind } from "../domain/ontology";
import type { RequirementAssessment, RequirementStatus } from "../engine/eligibility";
import { buildCapacityPlan } from "../engine/capacityPlan";

/* ------------------------------------------------------------------ */

function gap(
  id: string,
  kind: RequirementKind,
  status: RequirementStatus = "unmet",
  label = `krav ${id}`,
): RequirementAssessment {
  return {
    requirementId: id,
    kind,
    label,
    mandatory: true,
    status,
    explanation: "något fattas",
    source: { document: "AF" },
  };
}

/* ------------------------------------------------------------------ */

describe("delar upp luckorna efter vad regeln tillåter", () => {
  it("räknar omsättning och referenser som möjliga att täcka", () => {
    const plan = buildCapacityPlan([gap("r1", "revenue"), gap("r2", "reference")]);
    expect(plan.bridgeable.map((g) => g.requirementId)).toEqual(["r1", "r2"]);
    expect(plan.yours).toHaveLength(0);
  });

  it("säger rakt ut vad du måste klara själv", () => {
    // En plan som bara listar möjligheter döljer att F-skatt är din egen, och
    // den som upptäcker det sent har planerat runt ett hinder som inte fanns.
    const plan = buildCapacityPlan([gap("r1", "registration"), gap("r2", "geography")]);
    expect(plan.yours.map((g) => g.requirementId)).toEqual(["r1", "r2"]);
    expect(plan.bridgeable).toHaveLength(0);
    expect(plan.summary).toContain("måste du klara själv");
  });

  it("håller oklart skilt från både ja och nej", () => {
    // Ett felaktigt nej stänger ute lika effektivt som ett krav. Ett felaktigt
    // ja är värre: det får någon att planera runt en lösning som kanske inte
    // finns. Att bara räkna posterna i `unclear` fångade inte det — en tidigare
    // version av testet överlevde att oklart slogs ihop med möjligt.
    const plan = buildCapacityPlan([gap("r1", "insurance"), gap("r2", "certification")]);
    expect(plan.unclear.map((g) => g.requirementId)).toEqual(["r1", "r2"]);
    expect(plan.bridgeable).toHaveLength(0);
    expect(plan.yours).toHaveLength(0);
    expect(plan.summary).not.toContain("går att täcka genom att åberopa");
    expect(plan.summary).toContain("frågeperioden");
  });

  it("tar med åtgärdbara luckor och inte bara omöjliga", () => {
    // "Går att åtgärda" är fortfarande en lucka, och ofta just den som ska
    // lösas tillsammans med någon annan.
    const plan = buildCapacityPlan([gap("r1", "revenue", "remediable")]);
    expect(plan.bridgeable).toHaveLength(1);
  });

  it("lämnar uppfyllda och obesvarade krav utanför", () => {
    // Ett krav som är uppfyllt är ingen lucka. Ett okänt är inte heller det —
    // att uppgift saknas är inte samma sak som att något fattas.
    const plan = buildCapacityPlan([gap("r1", "revenue", "met"), gap("r2", "revenue", "unknown")]);
    expect(plan.bridgeable).toHaveLength(0);
    expect(plan.yours).toHaveLength(0);
    expect(plan.unclear).toHaveLength(0);
  });
});

/* ------------------------------------------------------------------ */

describe("solidariskt ansvar", () => {
  it("nämns när en lucka gäller ekonomisk kapacitet", () => {
    const plan = buildCapacityPlan([gap("r1", "revenue")]);
    expect(plan.jointLiabilityRelevant).toBe(true);
    expect(plan.rules).toContain(CAPACITY_JOINT_LIABILITY);
    expect(plan.summary).toContain("solidariskt ansvar");
    // Den som blir tillfrågad ska få veta det innan de svarar.
    expect(plan.summary).toContain("innan de svarar");
  });

  it("nämns inte när ingen lucka gäller ekonomisk kapacitet", () => {
    // En varning som alltid står läses inte. Den ska betyda något.
    const plan = buildCapacityPlan([gap("r1", "reference"), gap("r2", "capability")]);
    expect(plan.jointLiabilityRelevant).toBe(false);
    expect(plan.rules).not.toContain(CAPACITY_JOINT_LIABILITY);
    expect(plan.summary).not.toContain("solidariskt");
  });

  it("bär lagrummet och inte bara ordet", () => {
    expect(CAPACITY_JOINT_LIABILITY.rule).toContain("14 kap. 8 §");
    expect(CAPACITY_JOINT_LIABILITY.verification).toBe("verified");
  });
});

/* ------------------------------------------------------------------ */

describe("reglerna som alltid följer med", () => {
  it("säger att det alls är tillåtet", () => {
    const plan = buildCapacityPlan([]);
    expect(plan.rules.some((r) => r.rule.includes("får för ett visst kontrakt åberopa"))).toBe(
      true,
    );
  });

  it("skiljer åberopad kapacitet från underleverantör", () => {
    // Begreppen blandas ihop i nästan varje samtal om saken, och de har
    // olika konsekvenser.
    const plan = buildCapacityPlan([gap("r1", "revenue")]);
    const text = plan.rules.map((r) => r.rule).join(" ");
    expect(text).toContain("underleverantör");
    expect(text).toContain("kvalificeringskrav");
  });

  it("bär källa och kontrollflagga på varje regel", () => {
    for (const rule of buildCapacityPlan([gap("r1", "revenue")]).rules) {
      expect(rule.source.document).toBeTruthy();
      expect(rule.source.retrievedAt).toBeTruthy();
      expect(["verified", "unverified"]).toContain(rule.verification);
    }
  });

  it("lär ut regeln även när ingenting fattas", () => {
    const plan = buildCapacityPlan([]);
    expect(plan.summary).toContain("behöver inte vara ett stopp");
  });
});

/* ------------------------------------------------------------------ */

describe("regeltabellen", () => {
  it("täcker varje kravtyp", () => {
    const kinds: RequirementKind[] = [
      "revenue",
      "employees",
      "certification",
      "reference",
      "geography",
      "insurance",
      "registration",
      "capability",
      "document",
      "other",
    ];
    for (const kind of kinds) expect(bridgeRule(kind), kind).toBeDefined();
    expect(Object.keys(BRIDGE_RULES).sort()).toEqual([...kinds].sort());
  });

  it("säger vad som krävs när det går, och varför inte när det inte går", () => {
    for (const [kind, rule] of Object.entries(BRIDGE_RULES)) {
      if (rule.bridgeable === "yes") {
        expect(rule.commitment, kind).toBeTruthy();
      } else {
        expect(rule.why, kind).toBeTruthy();
      }
    }
  });

  it("kräver medverkan för en lånad referens", () => {
    // En referens utan medverkan är inte kapacitet — den är någon annans
    // meritlista, och den prövningen gör köparen.
    expect(BRIDGE_RULES.reference.commitment).toContain("medverka");
  });

  it("markerar bara ekonomisk kapacitet som möjligt solidariskt ansvar", () => {
    const flagged = Object.entries(BRIDGE_RULES)
      .filter(([, r]) => r.jointLiabilityPossible)
      .map(([k]) => k);
    expect(flagged).toEqual(["revenue"]);
  });
});

/* ------------------------------------------------------------------ */

describe("lovar aldrig ett utfall", () => {
  it("säger att underlaget avgör", () => {
    const plan = buildCapacityPlan([gap("r1", "revenue")]);
    expect(plan.summary).toContain("upphandlingsdokument");
    expect(plan.summary).toContain("inte vad köparen har bestämt");
  });

  it("säger aldrig att kravet därmed är uppfyllt", () => {
    const plan = buildCapacityPlan([gap("r1", "revenue"), gap("r2", "reference")]);
    expect(plan.summary).not.toMatch(
      /då är kravet uppfyllt|du klarar kravet|godkänd|räcker för att/i,
    );
  });
});
