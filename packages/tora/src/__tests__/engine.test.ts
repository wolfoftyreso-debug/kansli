import { describe, it, expect } from "vitest";

import {
  areaCovers,
  expandCapabilities,
  addMonths,
  daysBetween,
  type Company,
  type Requirement,
  type RequirementsExtraction,
} from "../domain/ontology";
import {
  decideVerdict,
  type AccessStatus,
  type QualificationStatus,
  type Verdict,
} from "../domain/verdicts";
import {
  UNVERIFIED_THRESHOLD_MARGIN,
  directAwardThresholdFor,
  thresholdSettles,
  unverifiedThresholdCaveat,
  type DirectAwardThreshold,
} from "../domain/regulations";
import { assessQualification, assessRequirement } from "../engine/eligibility";
import { assessContractAccess, assessProcurementAccess, findGoverningContract } from "../engine/access";
import {
  MIN_OBSERVATIONS_FOR_LEAD_TIME,
  effectiveEndRange,
  observedRenewalRhythm,
  predictNextProcurement,
  predictedProcurement,
} from "../engine/lifecycle";
import { scoreOpportunity } from "../engine/scoring";
import { buildOpportunities, buildOpportunity } from "../engine/opportunity";
import { buildRadar } from "../engine/radar";
import { buildCalendar } from "../engine/calendar";
import { diffOpportunities, deadlineAlerts, renderSms } from "../engine/alerts";
import { analysePrices, describePriceIntelligence } from "../engine/priceIntelligence";
import { redactCalendarEntry, redactOpportunity, scoreBand } from "../engine/entitlement";
import { createLocalApi } from "../engine/api";
import {
  DEMO_TODAY,
  areas,
  capabilities,
  certifications,
  contracts,
  demoCompany,
  demoGraph,
  procurements,
} from "../data/seed";

const ctx = { graph: demoGraph, today: DEMO_TODAY };
const eligibilityCtx = { areas, capabilities, certifications, today: DEMO_TODAY };

const procurement = (id: string) => {
  const found = procurements.find((p) => p.id === id);
  if (!found) throw new Error(`missing procurement ${id}`);
  return found;
};

const contract = (id: string) => {
  const found = contracts.find((c) => c.id === id);
  if (!found) throw new Error(`missing contract ${id}`);
  return found;
};

/* ------------------------------------------------------------------ */

describe("ontology helpers", () => {
  it("treats serving a county as serving its municipalities but not the reverse", () => {
    expect(areaCovers(areas, ["01"], ["0138"])).toBe(true);
    expect(areaCovers(areas, ["0138"], ["01"])).toBe(false);
  });

  it("expands a capability to what it implies, one way only", () => {
    expect(expandCapabilities(capabilities, ["el.entreprenad"])).toContain("el.installation");
    expect(expandCapabilities(capabilities, ["el.installation"])).not.toContain("el.entreprenad");
  });

  it("clamps month arithmetic to the end of a short month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(daysBetween("2026-01-01", "2026-01-31")).toBe(30);
  });
});

/* ------------------------------------------------------------------ */

describe("verdict guard", () => {
  it("refuses to assert RIGHT without a verifiable legal basis", () => {
    const decision = decideVerdict({ access: "granted", qualification: "qualified" });
    expect(decision.verdict).toBe("UNKNOWN");
    expect(decision.verdict).not.toBe("RIGHT");
  });

  it("asserts RIGHT only when a contract backs it", () => {
    const decision = decideVerdict({
      access: "granted",
      qualification: "qualified",
      legalBasis: {
        contractId: "contract:x",
        reason: "Rangordnad etta.",
        source: { document: "Ramavtal" },
      },
    });
    expect(decision.verdict).toBe("RIGHT");
    expect(decision.legalBasis?.contractId).toBe("contract:x");
  });

  it("puts a definitive requirement failure ahead of everything else", () => {
    expect(decideVerdict({ access: "granted", qualification: "failed" }).verdict).toBe("NOT_ELIGIBLE");
  });

  it("reports UNKNOWN rather than guessing when facts are missing", () => {
    expect(decideVerdict({ access: "competitive", qualification: "unknown" }).verdict).toBe("UNKNOWN");
  });

  /**
   * Exhaustive rather than random. The input domain is small and finite, so
   * enumerating every combination is a stronger guarantee than sampling — and it
   * means a newly added AccessStatus cannot slip past the guard unexamined.
   */
  it("holds the RIGHT guard across every possible input combination", () => {
    const accesses: AccessStatus[] = [
      "granted",
      "open",
      "competitive",
      "discretionary",
      "blocked",
      "unknown",
    ];
    const qualifications: QualificationStatus[] = ["qualified", "remediable", "failed", "unknown"];
    const bases = [
      undefined,
      { contractId: "contract:x", reason: "Rangordnad etta.", source: { document: "Ramavtal" } },
    ];

    let sawRight = false;
    accesses.forEach((access) => {
      qualifications.forEach((qualification) => {
        bases.forEach((legalBasis) => {
          const decision = decideVerdict({ access, qualification, legalBasis });
          const where = `${access}/${qualification}/${legalBasis ? "basis" : "no-basis"}`;

          if (decision.verdict === "RIGHT") {
            sawRight = true;
            expect(decision.legalBasis, where).toBeDefined();
            expect(access, where).toBe("granted");
            expect(qualification, where).toBe("qualified");
          }
          if (legalBasis === undefined) {
            expect(decision.verdict, where).not.toBe("RIGHT");
          }
          if (qualification === "failed") {
            expect(decision.verdict, where).toBe("NOT_ELIGIBLE");
          }
          // Every verdict must explain itself; a blank rationale is a silent claim.
          expect(decision.rationale.length, where).toBeGreaterThan(0);
        });
      });
    });

    // Guards that can never fire are worthless — prove RIGHT is still reachable.
    expect(sawRight).toBe(true);
  });

  it("holds the RIGHT guard through the whole pipeline, across degraded profiles", () => {
    // Profiles with facts progressively removed. None of these may conjure a
    // right, and none may crash the pipeline.
    const variants: Company[] = [
      demoCompany,
      { ...demoCompany, certifications: [], references: [], registrations: [] },
      { ...demoCompany, employees: undefined, annualRevenueSek: undefined, insurance: {} },
      { ...demoCompany, capabilities: [], subcontractorCapabilities: [] },
      { ...demoCompany, servesAreas: [] },
      {
        ...demoCompany,
        employees: undefined,
        annualRevenueSek: undefined,
        certifications: [],
        references: [],
        registrations: [],
        capabilities: [],
        servesAreas: [],
        insurance: {},
      },
    ];

    variants.forEach((company, index) => {
      buildOpportunities(company, ctx).forEach((opportunity) => {
        if (opportunity.verdict === "RIGHT") {
          expect(opportunity.legalBasis, `variant ${index}: ${opportunity.title}`).toBeDefined();
          expect(opportunity.legalBasis?.contractId).toBeTruthy();
          expect(opportunity.legalBasis?.source.document).toBeTruthy();
        }
      });
    });
  });
});

/* ------------------------------------------------------------------ */

describe("eligibility", () => {
  it("distinguishes 'not stated' from 'does not have'", () => {
    const requirement = procurement("proc:nacka-elservice").requirements.find(
      (r) => r.id === "req:nacka:iso14001",
    )!;

    const silent = assessRequirement(requirement, { ...demoCompany, certifications: [] }, eligibilityCtx);
    expect(silent.status).toBe("unknown");

    const stated = assessRequirement(requirement, demoCompany, eligibilityCtx);
    expect(stated.status).toBe("remediable");
    expect(stated.remediation).toBeDefined();
  });

  it("counts only references that match capability, recency, value and customer type", () => {
    const requirement = procurement("proc:nacka-elservice").requirements.find(
      (r) => r.id === "req:nacka:references",
    )!;
    // Two public references qualify; the private Brf job does not.
    expect(assessRequirement(requirement, demoCompany, eligibilityCtx).status).toBe("met");

    const withoutPublic = {
      ...demoCompany,
      references: demoCompany.references.filter((r) => !r.customerIsPublic),
    };
    expect(assessRequirement(requirement, withoutPublic, eligibilityCtx).status).toBe("remediable");
  });

  it("never machine-decides a free-text requirement", () => {
    const requirement = procurement("proc:nacka-elservice").requirements.find(
      (r) => r.id === "req:nacka:beredskap",
    )!;
    expect(assessRequirement(requirement, demoCompany, eligibilityCtx).status).toBe("unknown");
  });

  it("lets missing facts outrank a fixable gap when aggregating", () => {
    const result = assessQualification(
      procurement("proc:nacka-elservice").requirements,
      demoCompany,
      eligibilityCtx,
    );
    expect(result.counts.unknown).toBeGreaterThan(0);
    expect(result.status).toBe("unknown");
  });

  it("fails outright on a capability the company neither has nor subcontracts", () => {
    const result = assessQualification(
      procurement("proc:region-reservkraft").requirements,
      { ...demoCompany, subcontractorCapabilities: [] },
      eligibilityCtx,
    );
    expect(result.status).toBe("failed");
  });
});

/* ------------------------------------------------------------------ */

/**
 * En kravlista ingen har läst.
 *
 * Motorn svarade tidigare `qualified` på en tom lista. Sant i logisk mening —
 * inget av noll krav är ouppfyllt — och fel i varje annan. Det är också exakt
 * den form varje inhämtad upphandling har, eftersom inhämtningen skriver
 * upphandlingar men inga krav. Ett verkligt flöde hade alltså gett blått ljus
 * på annonseringar vars underlag ingen öppnat.
 */
describe("kravlistan som ingen har läst", () => {
  const extraction: RequirementsExtraction = {
    source: { document: "Anbudsinbjudan", section: "4 Kvalificering" },
    method: "manual",
    extractedAt: "2026-08-01",
  };

  const met = procurement("proc:region-dis-laddinfra").requirements;

  it("svarar inte 'kvalificerad' på en tom kravlista utan underlag", () => {
    const result = assessQualification([], demoCompany, eligibilityCtx);
    expect(result.status).toBe("unknown");
    expect(result.explanation).toMatch(/inte inlästa/);
  });

  it("svarar 'kvalificerad' på en tom lista när underlaget är läst", () => {
    const result = assessQualification([], demoCompany, eligibilityCtx, extraction);
    expect(result.status).toBe("qualified");
    expect(result.explanation).toBeUndefined();
  });

  it("dämpar även 'kvalificerad' på krav företaget faktiskt uppfyller", () => {
    // Utan intyg vet vi inte att listan är hel, och "uppfyller kraven" är ett
    // påstående om hela listan.
    expect(assessQualification(met, demoCompany, eligibilityCtx).status).toBe("unknown");
    expect(assessQualification(met, demoCompany, eligibilityCtx, extraction).status).toBe(
      "qualified",
    );
  });

  /** 12 MSEK mot företagets 8 — ett gap inlånad kapacitet rimligen överbryggar. */
  const gap: Requirement[] = [
    {
      id: "req:probe:revenue",
      kind: "revenue",
      label: "Årsomsättning minst 12 MSEK",
      mandatory: true,
      minAnnualRevenueSek: 12_000_000,
      source: { document: "Anbudsinbjudan", section: "4.2" },
    },
  ];

  it("dämpar 'remediable', eftersom även den lovar att inget mer står i vägen", () => {
    expect(assessQualification(gap, demoCompany, eligibilityCtx, extraction).status).toBe(
      "remediable",
    );
    expect(assessQualification(gap, demoCompany, eligibilityCtx).status).toBe("unknown");
  });

  it("låter ett bestämt nej stå — fler krav kan bara lägga till uteslutningar", () => {
    const fails = procurement("proc:region-reservkraft").requirements;
    const company = { ...demoCompany, subcontractorCapabilities: [] };
    expect(assessQualification(fails, company, eligibilityCtx).status).toBe("failed");
    expect(assessQualification(fails, company, eligibilityCtx, extraction).status).toBe("failed");
  });

  it("döljer inte de gap som faktiskt hittats", () => {
    const capped = assessQualification(gap, demoCompany, eligibilityCtx);
    const full = assessQualification(gap, demoCompany, eligibilityCtx, extraction);
    expect(capped.assessments).toEqual(full.assessments);
    expect(capped.blockers).toEqual(full.blockers);
    expect(capped.counts).toEqual(full.counts);
  });

  it("skiljer 'kraven är inte lästa' från 'profilen svarar inte'", () => {
    // Två `unknown` med helt olika åtgärd: den ena löser företaget själv.
    const profileGap = assessQualification(
      procurement("proc:nacka-elservice").requirements,
      demoCompany,
      eligibilityCtx,
      extraction,
    );
    expect(profileGap.status).toBe("unknown");
    expect(profileGap.explanation).toBeUndefined();

    const unread = assessQualification([], demoCompany, eligibilityCtx);
    expect(unread.explanation).toBeDefined();
    expect(
      decideVerdict({ access: "open", qualification: "unknown", qualificationExplanation: unread.explanation }).rationale,
    ).toBe(unread.explanation);
  });

  it("säger uttryckligen att tomt inte betyder kravlöst", () => {
    const result = assessQualification([], demoCompany, eligibilityCtx);
    expect(result.explanation).toMatch(/betyder inte att inga ställs/);
  });

  it("låter inte poängsättningen påstå varför listan är tom", () => {
    const target = procurement("proc:nacka-elservice");
    const scoreFor = (e?: RequirementsExtraction) =>
      scoreOpportunity(
        { ...target, requirements: [], requirementsExtraction: e },
        demoCompany,
        assessQualification([], demoCompany, eligibilityCtx, e),
        { areas, capabilities, today: DEMO_TODAY, access: "competitive" },
      ).factors.find((f) => f.key === "requirements")!;

    const unread = scoreFor();
    expect(unread.explanation).toMatch(/inte inlästa/);
    const read = scoreFor(extraction);
    expect(read.explanation).toMatch(/inga obligatoriska kvalificeringskrav/);

    // Oavsett vilket får faktorn inget värde: den utesluts ur medelvärdet och
    // sänker konfidensen, i stället för att räknas som noll eller ett.
    expect(unread.value).toBeUndefined();
    expect(read.value).toBeUndefined();
  });

  it("sätter förbehåll när kraven är maskinläsa och ogranskade", () => {
    const target = procurement("proc:tyreso-belysning");
    const withMethod = (method: "manual" | "automated", reviewed?: boolean) =>
      buildOpportunity(
        {
          ...target,
          requirementsExtraction: {
            source: { document: "Förfrågningsunderlag.pdf" },
            method,
            extractedAt: DEMO_TODAY,
            reviewed,
          },
        },
        demoCompany,
        ctx,
      ).caveats.map((c) => c.key);

    expect(withMethod("automated", false)).toContain("unreviewed_extraction");
    expect(withMethod("automated")).toContain("unreviewed_extraction");
    // En granskad tolkning och en manuell inläsning är båda kontrollerade.
    expect(withMethod("automated", true)).not.toContain("unreviewed_extraction");
    expect(withMethod("manual")).not.toContain("unreviewed_extraction");
  });

  it("dämpar inte utfallet för en maskinläst lista — förbehållet är svaret", () => {
    // Att svara OKÄNT på varje maskinläst upphandling vore att göra
    // extraktionen värdelös. Läser modellen fel blir kravet `other` → `unknown`
    // av sig självt; kvar är fallet där tolkningen ser riktig ut.
    const target = procurement("proc:tyreso-belysning");
    const machine = buildOpportunity(
      {
        ...target,
        requirementsExtraction: {
          source: { document: "Förfrågningsunderlag.pdf" },
          method: "automated",
          extractedAt: DEMO_TODAY,
        },
      },
      demoCompany,
      ctx,
    );
    expect(machine.verdict).toBe("COMPETITIVE");
  });

  it("bär förbehållet även när svaret är ett nej", () => {
    // En felläst lista kan utesluta lika gärna som släppa igenom.
    const target = procurement("proc:region-reservkraft");
    const opportunity = buildOpportunity(
      {
        ...target,
        requirementsExtraction: {
          source: { document: "Förfrågningsunderlag.pdf" },
          method: "automated",
          extractedAt: DEMO_TODAY,
        },
      },
      { ...demoCompany, subcontractorCapabilities: [] },
      ctx,
    );
    expect(opportunity.verdict).toBe("NOT_ELIGIBLE");
    expect(opportunity.caveats.map((c) => c.key)).toContain("unreviewed_extraction");
  });

  it("bär underlaget vidare så det går att visa vad som lästes", () => {
    expect(assessQualification([], demoCompany, eligibilityCtx, extraction).extraction).toBe(
      extraction,
    );
    expect(assessQualification([], demoCompany, eligibilityCtx).extraction).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */

/**
 * Rättigheten som inte sträcker sig till nästa upphandling.
 *
 * Rangordningen på ett ramavtal styr avrop under avtalstiden. Den förutsedda
 * efterträdaren ärvde den — och fick därmed `LegalBasis` från ett annat avtal
 * och rubriken "Rättighet" på en upphandling som inte var annonserad.
 */
describe("förutsedd efterträdare ärver inte avtalet", () => {
  const opportunities = buildOpportunities(demoCompany, ctx);
  const find = (id: string) => {
    const found = opportunities.find((o) => o.procurementId === id);
    if (!found) throw new Error(`no opportunity for ${id}`);
    return found;
  };

  const held = contract("contract:tyresobostader-fastighetsel");
  const successor = () =>
    predictedProcurement(predictNextProcurement(held, demoGraph, DEMO_TODAY), held);

  it("ger ingen rättighet till den förväntade nya upphandlingen", () => {
    // Mätt på åtkomstmotorn direkt. Går det bara via pipelinen kan testet passera
    // på fel grund — kravtaket ger ändå UNKNOWN, och då mäts inte det här alls.
    const access = assessProcurementAccess(successor(), demoCompany, ctx);
    expect(access.status).toBe("unknown");
    expect(access.legalBasis).toBeUndefined();
    expect(access.governingContractId).toBe(held.id);

    const next = find("pred:contract:tyresobostader-fastighetsel");
    expect(next.verdict).toBe("UNKNOWN");
    expect(next.legalBasis).toBeUndefined();
  });

  it("håller även om någon skulle hinna läsa kraven i förväg", () => {
    // De två spärrarna är oberoende. Skulle en källa publicera utkast till krav
    // innan annonseringen lyfts kravtaket — och rättigheten får ändå inte
    // uppstå, för det är avtalstiden som sätter gränsen, inte kravlistan.
    const withRequirements = {
      ...successor(),
      requirementsExtraction: {
        source: { document: "Utkast till förfrågningsunderlag" },
        method: "manual" as const,
        extractedAt: DEMO_TODAY,
      },
    };
    const opportunity = buildOpportunity(withRequirements, demoCompany, ctx);
    expect(opportunity.verdict).not.toBe("RIGHT");
    expect(opportunity.legalBasis).toBeUndefined();
  });

  it("säger ändå att företaget har det nuvarande uppdraget", () => {
    const next = find("pred:contract:tyresobostader-fastighetsel");
    expect(next.rationale).toMatch(/Ramavtal fastighetsel och elservice 2024–2027/);
    expect(next.rationale).toMatch(/ingen rätt till den efterföljande upphandlingen/);
  });

  it("behåller det andra hållet: den som inte har avtalet utestängs inte heller", () => {
    const other = find("pred:contract:tyreso-elservice");
    expect(other.verdict).toBe("UNKNOWN");
    expect(other.rationale).toMatch(/Rikselektriska AB/);
  });

  it("ger rättigheten till avropet, som faktiskt styrs av rangordningen", () => {
    const callOff = find("proc:tyresobostader-avrop-hiss");
    expect(callOff.verdict).toBe("RIGHT");
    expect(callOff.legalBasis?.contractId).toBe("contract:tyresobostader-fastighetsel");
  });
});

/* ------------------------------------------------------------------ */

describe("access", () => {
  it("grants access to the rank-1 supplier on a live framework, with a basis", () => {
    const result = assessContractAccess(contract("contract:tyresobostader-fastighetsel"), demoCompany, ctx);
    expect(result.status).toBe("granted");
    expect(result.legalBasis?.contractId).toBe("contract:tyresobostader-fastighetsel");
  });

  it("does not grant a right merely for being on the framework", () => {
    const result = assessContractAccess(contract("contract:central-laddinfra"), demoCompany, ctx);
    expect(result.status).toBe("blocked");
    expect(result.legalBasis).toBeUndefined();
  });

  it("picks the longest-running contract when several could route the purchase", () => {
    const organization = demoGraph.organizations.find((o) => o.id === "org:tyreso")!;
    const governing = findGoverningContract(organization, ["el.laddinfra"], ["0138"], ctx);
    // The procurement centre's framework runs to 2028 and outlasts the local pilot.
    expect(governing?.id).toBe("contract:central-laddinfra");
  });

  it("does not let a capability implication widen what a contract covers", () => {
    const organization = demoGraph.organizations.find((o) => o.id === "org:tyreso")!;
    // el.laddinfra implies el.installation, but the charging framework must not
    // therefore appear to lock up general electrical service.
    const governing = findGoverningContract(organization, ["el.service", "el.installation"], ["0138"], ctx);
    expect(governing?.id).toBe("contract:tyreso-elservice");
  });

  it("treats a possible direct award as the buyer's decision, never an entitlement", () => {
    const result = assessProcurementAccess(procurement("proc:haninge-forskola"), demoCompany, ctx);
    expect(result.status).toBe("discretionary");
    expect(result.caveats.map((c) => c.key)).toContain("directAwardIsBuyersDecision");
    expect(result.caveats.map((c) => c.key)).toContain("noEntitlementFromScarcity");
  });

  it("keeps a DPS open for admission", () => {
    const result = assessProcurementAccess(procurement("proc:region-dis-laddinfra"), demoCompany, ctx);
    expect(result.status).toBe("open");
    expect(result.caveats.map((c) => c.key)).toContain("dpsAdmissionStaysOpen");
  });

  it("has a direct-award threshold for LOU on the evaluation date", () => {
    expect(directAwardThresholdFor("LOU", DEMO_TODAY)?.amountSek).toBe(700_000);
  });
});

/* ------------------------------------------------------------------ */

/**
 * Gränsen och osäkerheten.
 *
 * Direktupphandlingsgränsen avgör två motsatta juridiska påståenden: att köpet
 * måste konkurrensutsättas, eller att direktupphandling kan vara möjlig.
 * Konstanterna är kontrollerade mot källan (2026-08-21) och ska därför avgöra
 * ända in till kanten — det var spärren för en *okontrollerad* siffra som höll
 * inne svaret nära gränsen, inte gränsen som sådan.
 *
 * Spärrmekaniken finns kvar och testas nedan mot en konstruerad okontrollerad
 * rad: den dagen en ny revision förs in provisoriskt ska bandet bita igen utan
 * ny kod.
 */
describe("gränsen som är verifierad", () => {
  const LOU_THRESHOLD = 700_000;

  /** En direktupphandling med angivet värde, i övrigt som demofallet. */
  const atValue = (valueSek: number) => ({
    ...procurement("proc:haninge-forskola"),
    estimatedValueSek: valueSek,
  });

  it("avgör strax under gränsen", () => {
    // Innan konstanterna kontrollerats mot källan var detta OKÄNT — nära en
    // siffra systemet inte kunde gå i god för fanns inget svar att ge.
    const result = assessProcurementAccess(atValue(690_000), demoCompany, ctx);
    expect(result.status).toBe("discretionary");
  });

  it("avgör strax över gränsen", () => {
    const result = assessProcurementAccess(atValue(710_000), demoCompany, ctx);
    expect(result.status).toBe("competitive");
  });

  it("räknar värdet på gränsen som konkurrensutsatt", () => {
    // 19 a kap.: direktupphandling får användas under gränsen. Exakt på den är
    // köpet inte under.
    const result = assessProcurementAccess(atValue(LOU_THRESHOLD), demoCompany, ctx);
    expect(result.status).toBe("competitive");
  });

  it("bär inte längre någon overifierad-varning", () => {
    const result = assessProcurementAccess(atValue(450_000), demoCompany, ctx);
    expect(result.status).toBe("discretionary");
    expect(result.caveats.map((c) => c.key)).not.toContain("unverified_threshold");
    // Doktrinen står kvar: beslutet är fortfarande organisationens.
    expect(result.caveats.map((c) => c.key)).toContain("directAwardIsBuyersDecision");
  });

  it("gäller från de förenklade reglernas ikraftträdande, inte från 2024", () => {
    // Backtestens fall från 2023 ska mötas av den gräns som faktiskt gällde då.
    expect(directAwardThresholdFor("LOU", "2023-04-03")?.amountSek).toBe(700_000);
    expect(directAwardThresholdFor("LOU", "2022-01-31")).toBeUndefined();
  });

  it("byter LUK-belopp vid årsskiftet 2026", () => {
    // 5 % av koncessionströskelvärdet, som revideras vartannat år. En konstant
    // utan giltighetsperiod var själva felet i den ursprungliga raden.
    expect(directAwardThresholdFor("LUK", "2025-06-01")?.amountSek).toBe(2_994_008);
    expect(directAwardThresholdFor("LUK", "2026-06-01")?.amountSek).toBe(2_799_554);
    // Före 2024 är beloppet inte kontrollerat mot källan; en saknad rad ger
    // OKÄNT i stället för ett svar på en okontrollerad siffra.
    expect(directAwardThresholdFor("LUK", "2023-06-01")).toBeUndefined();
  });
});

describe("spärren för en okontrollerad gräns", () => {
  const LOU_THRESHOLD = 700_000;
  const margin = LOU_THRESHOLD * UNVERIFIED_THRESHOLD_MARGIN;

  const unverified: DirectAwardThreshold = {
    regulation: "LOU",
    amountSek: LOU_THRESHOLD,
    effectiveFrom: "2024-01-01",
    source: { document: "test" },
    verification: "unverified",
  };

  it("vägrar avgöra inom hela bandet, åt båda håll", () => {
    // Nära en okontrollerad gräns vilar båda de motsatta juridiska svaren på en
    // siffra systemet självt säger att det inte kan gå i god för.
    expect(thresholdSettles(unverified, LOU_THRESHOLD)).toBe(false);
    expect(thresholdSettles(unverified, LOU_THRESHOLD - margin)).toBe(false);
    expect(thresholdSettles(unverified, LOU_THRESHOLD + margin)).toBe(false);
  });

  it("avgör precis utanför bandet", () => {
    // Långt från gränsen vänder inte ens en rejält felaktig konstant svaret.
    expect(thresholdSettles(unverified, LOU_THRESHOLD - margin - 1)).toBe(true);
    expect(thresholdSettles(unverified, LOU_THRESHOLD + margin + 1)).toBe(true);
  });

  it("låter en verifierad gräns avgöra ända in till kanten", () => {
    const verified: DirectAwardThreshold = { ...unverified, verification: "verified" };
    // Hela poängen: spärren gäller osäkerheten, inte tröskeln som sådan. En
    // siffra vi kan gå i god för ska ge ett svar också vid gränsen.
    expect(thresholdSettles(verified, LOU_THRESHOLD)).toBe(true);
    expect(thresholdSettles(verified, LOU_THRESHOLD - 1)).toBe(true);
  });

  it("bär förbehållet med belopp och källa", () => {
    const caveat = unverifiedThresholdCaveat(unverified);
    expect(caveat.key).toBe("unverified_threshold");
    expect(caveat.text).toContain("700");
    expect(caveat.text).toContain("inte verifierad");
  });

  it("ger OKÄNT som verdict, inte bara som access-status", () => {
    // Access-status är ett internt begrepp. Det som når användaren är verdict,
    // och kedjan hela vägen dit måste bära osäkerheten.
    const decision = decideVerdict({ access: "unknown", qualification: "qualified" });
    expect(decision.verdict).toBe("UNKNOWN");
  });
});

/* ------------------------------------------------------------------ */

describe("lifecycle", () => {
  it("expresses an undecided option as a range rather than a single date", () => {
    const range = effectiveEndRange(contract("contract:tyreso-elservice"));
    expect(range.earliest).toBe("2027-06-30");
    expect(range.latest).toBe("2028-06-30");
  });

  it("derives the renewal rhythm from successive contracts", () => {
    const rhythm = observedRenewalRhythm(contract("contract:tyreso-elservice"), demoGraph);
    expect(rhythm?.medianMonths).toBe(48);
    expect(rhythm?.intervals).toBe(2);
    expect(rhythm?.sufficient).toBe(true);
  });

  it("explains its prediction and stays under full confidence", () => {
    const prediction = predictNextProcurement(contract("contract:tyreso-elservice"), demoGraph, DEMO_TODAY);
    expect(prediction.leadTimeSource).toBe("observed");
    expect(prediction.expectedAnnouncement.from < prediction.effectiveEnd.earliest).toBe(true);
    expect(prediction.confidence).toBeLessThan(1);
    expect(prediction.basis.length).toBeGreaterThanOrEqual(3);
  });

  it("will not call a single observed gap a rhythm", () => {
    // Drop the 2015 contract, leaving one interval instead of two.
    const thin = {
      ...demoGraph,
      contracts: demoGraph.contracts.filter((c) => c.id !== "contract:tyreso-elservice-2015"),
    };
    const rhythm = observedRenewalRhythm(contract("contract:tyreso-elservice"), thin);
    expect(rhythm?.intervals).toBe(1);
    expect(rhythm?.sufficient).toBe(false);

    const prediction = predictNextProcurement(contract("contract:tyreso-elservice"), thin, DEMO_TODAY);
    expect(prediction.basis.join(" ")).toContain("För få för att fastställa en upphandlingsrytm");
  });

  /**
   * En graf med för få ledtidsobservationer för en köpare.
   *
   * Testerna nedan byggde tidigare sitt tunna underlag genom att stryka en
   * bestämd historisk post ur demografen. Det uttryckte inte vad de prövar
   * ("under bevisgolvet") utan hur stort datasetet råkade vara — och när demon
   * fick en ny annonsering med avtalsstart var de plötsligt inte tunna längre,
   * fast ingenting i motorn hade ändrats.
   */
  const withFewLeadTimes = (organizationId: string, keep = MIN_OBSERVATIONS_FOR_LEAD_TIME - 1) => {
    let kept = 0;
    return {
      ...demoGraph,
      procurements: demoGraph.procurements.filter((p) => {
        const counts = p.organizationId === organizationId && p.announcedAt && p.contractStart;
        if (!counts) return true;
        kept += 1;
        return kept <= keep;
      }),
    };
  };

  it("marks a lead time below the evidence floor as weak, and still uses it", () => {
    const thin = withFewLeadTimes("org:tyreso");
    const prediction = predictNextProcurement(contract("contract:tyreso-elservice"), thin, DEMO_TODAY);
    expect(prediction.leadTimeSource).toBe("observed_weak");
    // The observation is used rather than discarded for a generic default.
    expect(prediction.leadTimeDays).not.toBe(150);
    expect(prediction.basis.join(" ")).toContain("För få för att fastställa ett mönster");
  });

  it("pays less confidence for weak evidence than for sufficient evidence", () => {
    const thin = {
      ...withFewLeadTimes("org:tyreso"),
      contracts: demoGraph.contracts.filter((c) => c.id !== "contract:tyreso-elservice-2015"),
    };
    const strong = predictNextProcurement(contract("contract:tyreso-elservice"), demoGraph, DEMO_TODAY);
    const weak = predictNextProcurement(contract("contract:tyreso-elservice"), thin, DEMO_TODAY);
    expect(weak.confidence).toBeLessThan(strong.confidence);
  });

  it("never presents a prediction as near-certain", () => {
    demoGraph.contracts.forEach((c) => {
      expect(predictNextProcurement(c, demoGraph, DEMO_TODAY).confidence).toBeLessThanOrEqual(0.9);
    });
  });

  it("falls back to a stated default when a buyer has no announcement history", () => {
    const prediction = predictNextProcurement(
      contract("contract:tyresobostader-fastighetsel"),
      demoGraph,
      DEMO_TODAY,
    );
    expect(prediction.leadTimeSource).toBe("default");
    expect(prediction.basis.join(" ")).toContain("schablon");
  });
});

/* ------------------------------------------------------------------ */

describe("scoring", () => {
  it("excludes unknown factors from the score and reports reduced confidence", () => {
    const target = procurement("proc:region-dis-laddinfra");
    const qualification = assessQualification(target.requirements, demoCompany, eligibilityCtx);
    const score = scoreOpportunity(target, demoCompany, qualification, {
      areas,
      capabilities,
      today: DEMO_TODAY,
    });

    // The DPS publishes neither a value nor a deadline, so those factors cannot
    // be scored — and must not be silently counted as zero.
    expect(score.confidence).toBeLessThan(1);
    expect(score.factors.some((f) => f.value === undefined)).toBe(true);
    expect(score.score).toBeGreaterThan(50);
  });

  it("is reproducible from the factor table it returns", () => {
    const target = procurement("proc:nacka-elservice");
    const qualification = assessQualification(target.requirements, demoCompany, eligibilityCtx);
    const score = scoreOpportunity(target, demoCompany, qualification, {
      areas,
      capabilities,
      today: DEMO_TODAY,
    });

    const known = score.factors.filter((f) => f.value !== undefined);
    const weight = known.reduce((sum, f) => sum + f.weight, 0);
    const recomputed = Math.round(
      (known.reduce((sum, f) => sum + f.weight * (f.value as number), 0) / weight) * 100,
    );
    expect(recomputed).toBe(score.score);
  });

  it("names the biggest uncertainty in its explanation", () => {
    const target = procurement("proc:nacka-elservice");
    const qualification = assessQualification(target.requirements, demoCompany, eligibilityCtx);
    const score = scoreOpportunity(target, demoCompany, qualification, {
      areas,
      capabilities,
      today: DEMO_TODAY,
    });
    expect(score.explanation).toMatch(/av 100/);
  });
});

/* ------------------------------------------------------------------ */

describe("opportunities for the demo company", () => {
  const opportunities = buildOpportunities(demoCompany, ctx);
  const byProcurement = (id: string) => {
    const found = opportunities.find((o) => o.procurementId === id);
    if (!found) throw new Error(`no opportunity for ${id}`);
    return found;
  };

  /**
   * Datasetets egen utfästelse, prövad.
   *
   * `seed.ts` säger att varje utfall ska gå att nå från en profil, och det var
   * inte sant: `COMPETITIVE` fanns i README:s tabell och i motorn men aldrig i
   * demon. En demo som bara visar fem av sex utfall läser som om systemet
   * antingen ger dig något eller stänger dig ute, medan svaret oftast är att du
   * får vara med och slåss om det.
   *
   * Testet finns för att påståendet inte ska kunna rosta tillbaka. Det är också
   * det enda som fångar motsatsen: att en ändring i motorn gör ett utfall
   * onåbart utan att något annat test bryts.
   */
  it("når varje utfall från en och samma profil", () => {
    const reached = new Set(opportunities.map((o) => o.verdict));
    const all: Verdict[] = [
      "RIGHT",
      "ELIGIBLE",
      "POSSIBLE",
      "COMPETITIVE",
      "NOT_ELIGIBLE",
      "UNKNOWN",
    ];
    const missing = all.filter((v) => !reached.has(v));
    expect(missing, `utfall som demon inte når: ${missing.join(", ")}`).toEqual([]);
  });

  it("finds work across several buyers", () => {
    expect(opportunities.length).toBeGreaterThan(4);
    expect(new Set(opportunities.map((o) => o.organizationId)).size).toBeGreaterThan(2);
  });

  it("reports a real right where a live framework creates one", () => {
    const right = byProcurement("proc:tyresobostader-avrop-hiss");
    expect(right.verdict).toBe("RIGHT");
    expect(right.legalBasis?.contractId).toBe("contract:tyresobostader-fastighetsel");
  });

  it("reports the DPS as something the company can act on now", () => {
    expect(byProcurement("proc:region-dis-laddinfra").verdict).toBe("ELIGIBLE");
  });

  it("blocks work routed through a framework the company is not party to", () => {
    const blocked = byProcurement("pred:contract:tyreso-laddinfra-pilot");
    expect(blocked.verdict).toBe("NOT_ELIGIBLE");
    expect(blocked.access.governingContractId).toBe("contract:central-laddinfra");
  });

  it("treats an incumbent's expiring contract as preparation time, not a rejection", () => {
    const upcoming = byProcurement("pred:contract:tyreso-elservice");
    expect(upcoming.verdict).toBe("UNKNOWN");
    expect(upcoming.timing).toBe("upcoming");
    expect(upcoming.recommendedActions.some((a) => a.label.includes("Förbered"))).toBe(true);
  });

  it("rules out work the company definitively cannot take", () => {
    expect(byProcurement("proc:region-reservkraft").verdict).toBe("NOT_ELIGIBLE");
  });

  it("gives every non-blocked opportunity something to do next", () => {
    opportunities
      .filter((o) => o.verdict !== "NOT_ELIGIBLE" && o.timing !== "closed")
      .forEach((o) => expect(o.recommendedActions.length).toBeGreaterThan(0));
  });

  it("attaches the scarcity guardrail wherever a direct award is in play", () => {
    const direct = byProcurement("proc:haninge-forskola");
    expect(direct.caveats.map((c) => c.key)).toContain("noEntitlementFromScarcity");
  });

  it("sorts what is open and imminent ahead of what is merely watched", () => {
    const buckets = opportunities.map((o) => o.timing);
    const rank = { open_now: 0, upcoming: 1, watch: 2, closed: 3 };
    const ranks = buckets.map((b) => rank[b]);
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });
});

/* ------------------------------------------------------------------ */

describe("radar and calendar", () => {
  const opportunities = buildOpportunities(demoCompany, ctx);

  it("summarises the market by organization and capability", () => {
    const radar = buildRadar(demoCompany, opportunities, demoGraph);
    expect(radar.organizations.length).toBeGreaterThan(2);
    expect(radar.capabilityAreas.length).toBeGreaterThan(1);
  });

  it("counts only live opportunities in the headline, and history separately", () => {
    const radar = buildRadar(demoCompany, opportunities, demoGraph);
    expect(radar.totalHistorical).toBeGreaterThan(0);
    expect(radar.totalRelevant).toBe(opportunities.length - radar.totalHistorical);
    expect(radar.totalRelevant).toBe(radar.openNow.length + radar.upcoming.length + radar.watch.length);
  });

  it("keeps the verdict breakdown consistent with the live count", () => {
    const radar = buildRadar(demoCompany, opportunities, demoGraph);
    const total = Object.values(radar.verdictCounts).reduce((sum, n) => sum + n, 0);
    expect(total).toBe(radar.totalRelevant);
  });

  it("keeps work the company cannot reach off the calendar", () => {
    const calendar = buildCalendar(opportunities, DEMO_TODAY);
    const blocked = new Set(
      opportunities.filter((o) => o.verdict === "NOT_ELIGIBLE").map((o) => o.id),
    );
    expect(blocked.size).toBeGreaterThan(0);
    expect(calendar.all.every((e) => !blocked.has(e.opportunityId))).toBe(true);
  });

  it("does not let an unreachable opportunity report a flattering score", () => {
    const blocked = opportunities.find((o) => o.access.status === "blocked");
    expect(blocked).toBeDefined();
    expect(blocked!.score.factors.find((f) => f.key === "access")?.value).toBe(0);
    expect(blocked!.score.score).toBeLessThan(80);
  });

  it("explains a closed procurement as closed, not as somebody else's framework", () => {
    const awarded = opportunities.find((o) => o.procurementId === "proc:hist:tyreso-2024")!;
    expect(awarded.rationale).toContain("Tilldelningsbeslut");
  });

  it("reports how many opportunities published no value, rather than hiding them", () => {
    const radar = buildRadar(demoCompany, opportunities, demoGraph);
    expect(radar.opportunitiesWithoutValue).toBeGreaterThan(0);
    expect(radar.knownValueSek).toBeGreaterThan(0);
  });

  it("builds a forward-looking calendar and marks predicted dates as predicted", () => {
    const calendar = buildCalendar(opportunities, DEMO_TODAY);
    expect(calendar.all.length).toBeGreaterThan(0);
    expect(calendar.all.every((e) => e.daysAway >= 0)).toBe(true);
    expect(calendar.all.some((e) => e.predicted)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */

describe("alerts", () => {
  const current = buildOpportunities(demoCompany, ctx);

  it("treats losing eligibility as critical and sends it by SMS", () => {
    const before = current.map((o) =>
      o.procurementId === "proc:region-dis-laddinfra" ? { ...o, verdict: "ELIGIBLE" as const } : o,
    );
    const after = current.map((o) =>
      o.procurementId === "proc:region-dis-laddinfra" ? { ...o, verdict: "NOT_ELIGIBLE" as const } : o,
    );

    const alerts = diffOpportunities(before, after, DEMO_TODAY);
    const worsened = alerts.find((a) => a.type === "verdict_worsened");
    expect(worsened?.severity).toBe("critical");
    expect(worsened?.channels).toContain("sms");
  });

  it("does not interrupt anyone about a new opportunity they cannot act on", () => {
    const newcomer = current.filter((o) => o.verdict === "NOT_ELIGIBLE");
    const alerts = diffOpportunities([], newcomer, DEMO_TODAY);
    expect(alerts.every((a) => a.severity === "low")).toBe(true);
  });

  it("reminds at fixed distances from a deadline", () => {
    // The Haninge deadline is 2026-08-28; check the 14-day mark.
    const alerts = deadlineAlerts(current, "2026-08-14");
    expect(alerts.some((a) => a.title.startsWith("14 dagar"))).toBe(true);
  });

  it("fits an SMS into 160 characters", () => {
    const alerts = diffOpportunities([], current, DEMO_TODAY);
    alerts.forEach((a) => expect(renderSms(a).length).toBeLessThanOrEqual(160));
  });
});

/* ------------------------------------------------------------------ */

describe("price intelligence", () => {
  it("refuses to publish a range from too thin a sample", () => {
    const result = analysePrices({ capabilities: ["el.reservkraft"], areas: ["0138"] }, demoGraph);
    expect(result.status).toBe("insufficient_data");
  });

  it("reports observed award values with the compliance notice attached", () => {
    const result = analysePrices({ capabilities: ["el.service", "el.installation"], areas: ["01"] }, demoGraph);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;

    expect(result.awardValues.count).toBeGreaterThanOrEqual(3);
    expect(result.awardValues.distinctSuppliers).toBeGreaterThanOrEqual(2);
    expect(result.awardValues.min).toBeLessThanOrEqual(result.awardValues.median);
    expect(result.awardValues.median).toBeLessThanOrEqual(result.awardValues.max);
    expect(result.compliance).toMatch(/samordna priser/);
    expect(result.competitors[0].wins).toBeGreaterThanOrEqual(1);
  });

  it("discloses that some awards published no value", () => {
    const result = analysePrices({ capabilities: ["el.service", "el.installation"], areas: ["01"] }, demoGraph);
    if (result.status !== "ok") throw new Error("expected data");
    expect(result.valueCoverage).toBeLessThan(1);
    expect(describePriceIntelligence(result)).toMatch(/saknar publicerat värde/);
  });

  it("offers no recommended price anywhere in its output", () => {
    const result = analysePrices({ capabilities: ["el.service"], areas: ["01"] }, demoGraph);
    const serialised = JSON.stringify(result).toLowerCase();
    expect(serialised).not.toMatch(/rekommenderat pris|recommendedprice|suggestedprice|targetprice/);
  });
});

/* ------------------------------------------------------------------ */

describe("freemium gating", () => {
  const opportunity = buildOpportunity(procurement("proc:nacka-elservice"), demoCompany, ctx);

  it("hides the buyer and the detail from a free user", () => {
    const view = redactOpportunity(opportunity, "free");
    expect(view.organizationName.state).toBe("locked");
    expect(view.deadlineAt.state).toBe("locked");
    expect(view.score.state).toBe("locked");
  });

  it("keeps enough visible for the free tier to be worth using", () => {
    const view = redactOpportunity(opportunity, "free");
    expect(view.verdict).toBe(opportunity.verdict);
    expect(view.scoreBand).toBe(scoreBand(opportunity.score.score));
    expect(view.timing).toBe(opportunity.timing);
  });

  it("bands scores into readable decades without exceeding 100", () => {
    expect(scoreBand(0)).toBe("0–9");
    expect(scoreBand(88)).toBe("80–89");
    expect(scoreBand(94)).toBe("90–100");
    expect(scoreBand(100)).toBe("90–100");
  });

  it("never puts a legal caveat behind the paywall", () => {
    const free = redactOpportunity(opportunity, "free");
    const paid = redactOpportunity(opportunity, "pro");
    expect(free.caveats).toEqual(paid.caveats);
  });

  it("leaks no locked value into the redacted object", () => {
    const view = redactOpportunity(opportunity, "free");
    const serialised = JSON.stringify(view);
    expect(serialised).not.toContain("Nacka kommun");
    expect(serialised).not.toContain(String(opportunity.estimatedValueSek));
  });

  it("redacts calendar entries too, keeping the shape but not the identity", () => {
    const entries = buildCalendar(buildOpportunities(demoCompany, ctx), DEMO_TODAY).all;
    expect(entries.length).toBeGreaterThan(0);

    const free = entries.map((e) => redactCalendarEntry(e, "free"));
    expect(free.every((e) => e.identified === false)).toBe(true);
    expect(free.every((e) => e.organizationName === "" && e.title === "")).toBe(true);
    // No deep link survives redaction.
    expect(free.every((e) => e.opportunityId === undefined)).toBe(true);
    // The dates and event kinds do survive — that is the free calendar overview.
    expect(free.every((e) => e.date.length > 0)).toBe(true);

    const paid = entries.map((e) => redactCalendarEntry(e, "pro"));
    expect(paid.every((e) => e.identified && e.organizationName.length > 0)).toBe(true);
  });

  it("leaks no buyer name through a redacted calendar", () => {
    const entries = buildCalendar(buildOpportunities(demoCompany, ctx), DEMO_TODAY).all;
    const serialised = JSON.stringify(entries.map((e) => redactCalendarEntry(e, "free")));
    expect(serialised).not.toContain("Nacka kommun");
    expect(serialised).not.toContain("Tyresö Bostäder");
  });

  it("leaks nothing identifying through the API on the free tier", () => {
    const api = createLocalApi(demoGraph);
    const request = { company: demoCompany, tier: "free" as const, today: DEMO_TODAY };

    // Every buyer name in the graph must be absent from every free-tier payload,
    // including the history list and the alert feed — both of which leaked before
    // the API boundary existed.
    const buyerNames = demoGraph.organizations.map((o) => o.name);
    const payloads = [
      JSON.stringify(api.getMarket(request)),
      JSON.stringify(api.getCalendar(request)),
    ];

    payloads.forEach((payload) => {
      buyerNames.forEach((name) => expect(payload).not.toContain(name));
    });
  });

  it("keeps the free tier's history and alerts useful without identifying them", () => {
    const api = createLocalApi(demoGraph);
    const free = api.getMarket({ company: demoCompany, tier: "free", today: DEMO_TODAY });
    const calendar = api.getCalendar({ company: demoCompany, tier: "free", today: DEMO_TODAY });

    expect(free.history.length).toBeGreaterThan(0);
    expect(free.history.every((h) => h.title.state === "locked")).toBe(true);
    // Counts and verdicts survive — that is what makes the teaser worth reading.
    expect(free.summary.totalRelevant).toBeGreaterThan(0);
    expect(free.history.every((h) => h.scoreBand.length > 0)).toBe(true);
    expect(calendar.alerts.state).toBe("locked");
    expect(calendar.alertCount).toBeGreaterThanOrEqual(0);
  });

  it("gates price intelligence on its own capability, not on the detail flag", () => {
    const api = createLocalApi(demoGraph);
    const id = `opp:${demoCompany.id}:proc:nacka-elservice`;

    const free = api.getOpportunity({ company: demoCompany, tier: "free", today: DEMO_TODAY, opportunityId: id });
    expect(free?.prices.state).toBe("locked");

    const pro = api.getOpportunity({ company: demoCompany, tier: "pro", today: DEMO_TODAY, opportunityId: id });
    expect(pro?.prices.state).toBe("unlocked");
  });

  it("returns undefined for an opportunity that does not exist", () => {
    const api = createLocalApi(demoGraph);
    expect(
      api.getOpportunity({ company: demoCompany, tier: "pro", today: DEMO_TODAY, opportunityId: "opp:nope" }),
    ).toBeUndefined();
  });

  it("unlocks everything for a paying tier", () => {
    const view = redactOpportunity(opportunity, "pro");
    expect(view.organizationName.state).toBe("unlocked");
    expect(view.qualification.state).toBe("unlocked");
    expect(view.sources.state).toBe("unlocked");
  });
});
