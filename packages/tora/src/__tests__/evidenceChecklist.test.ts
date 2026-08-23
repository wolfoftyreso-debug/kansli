/**
 * Checklistan över handlingar.
 *
 * Aritmetiken här är enkel; det som prövas hårdare är gränserna, eftersom det
 * är de som gör skillnad mellan en hjälp och en fälla:
 *
 *   oläst underlag  ≠  inga handlingar
 *   okänd ledtid    ≠  kort ledtid
 *   saknad uppgift  ≠  krav som brister
 *   katalogen       ≠  underlaget
 *
 * Den första är den farligaste. En checklista som ser fullständig ut för att
 * ingen läst underlaget är sämre än ingen alls, för då slutar man leta.
 */

import { describe, expect, it } from "vitest";

import {
  BASELINE_EVIDENCE,
  EVIDENCE,
  EVIDENCE_FOR_REQUIREMENT,
  ISSUER_LABEL,
  leadTimeLabel,
  startBy,
} from "../domain/evidence";
import type { Procurement, Requirement, RequirementsExtraction } from "../domain/ontology";
import type { RequirementAssessment, RequirementStatus } from "../engine/eligibility";
import { buildEvidenceChecklist, type EvidenceChecklist } from "../engine/evidenceChecklist";

/* ------------------------------------------------------------------ */

const EXTRACTION: RequirementsExtraction = {
  source: { document: "Administrativa föreskrifter", section: "AF 3" },
  method: "manual",
  extractedAt: "2026-08-01",
};

function procurement(overrides: Partial<Procurement> = {}): Procurement {
  return {
    id: "p1",
    organizationId: "o1",
    title: "Elservice",
    cpvCodes: [],
    capabilities: [],
    areas: [],
    regulation: "LOU",
    procedure: "open",
    status: "announced",
    deadlineAt: "2026-09-30",
    requirements: [],
    requirementsExtraction: EXTRACTION,
    sources: [],
    ...overrides,
  };
}

function requirement(overrides: Partial<Requirement> = {}): Requirement {
  return {
    id: "r1",
    label: "Ansvarsförsäkring om minst 10 MSEK",
    mandatory: true,
    source: { document: "AF" },
    kind: "insurance",
    minLiabilityCoverSek: 10_000_000,
    ...overrides,
  } as Requirement;
}

function assessment(id: string, status: RequirementStatus): RequirementAssessment {
  return {
    requirementId: id,
    kind: "insurance",
    label: "krav",
    mandatory: true,
    status,
    explanation: "",
    source: { document: "AF" },
  };
}

function ready(result: EvidenceChecklist) {
  if (result.status !== "ready") {
    throw new Error(`förväntade en checklista, fick unknown: ${result.explanation}`);
  }
  return result;
}

const TODAY = "2026-08-22";
const build = (p: Procurement, a?: RequirementAssessment[]) =>
  buildEvidenceChecklist({ procurement: p, assessments: a, today: TODAY });

/* ------------------------------------------------------------------ */

describe("oläst underlag är inte en tom checklista", () => {
  it("vägrar bygga lista utan bevis för att kravlistan är läst", () => {
    const result = build(procurement({ requirementsExtraction: undefined }));
    expect(result.status).toBe("unknown");
  });

  it("säger varför, i stället för att visa noll poster", () => {
    const result = build(procurement({ requirementsExtraction: undefined }));
    if (result.status !== "unknown") throw new Error("förväntade unknown");
    expect(result.explanation).toContain("inte känt fullständig");
    // Den som får ett nej ska veta vad man gör i stället.
    expect(result.explanation).toContain("upphandlingsdokumenten");
  });

  it("bär förbehållet även när den vägrar", () => {
    const result = build(procurement({ requirementsExtraction: undefined }));
    expect(result.caveats.map((c) => c.key)).toContain("documentsGovern");
  });
});

/* ------------------------------------------------------------------ */

describe("baslinjen", () => {
  it("står kvar även för en upphandling utan ett enda krav", () => {
    // Egen försäkran och uteslutningsgrunder följer av regelverket, inte av
    // den enskilda upphandlingen.
    const result = ready(build(procurement()));
    const ids = result.items.map((i) => i.evidence.id);
    for (const id of BASELINE_EVIDENCE) expect(ids).toContain(id);
  });

  it("märker baslinjeposter som rutin så länge inget krav pekar på dem", () => {
    const result = ready(build(procurement()));
    const espd = result.items.find((i) => i.evidence.id === "espd");
    expect(espd?.origin).toBe("baseline");
    expect(espd?.urgency).toBe("routine");
  });

  it("låter ett krav lyfta en baslinjepost till ett krav i upphandlingen", () => {
    // Registreringsbevis är baslinje — men står det som eget krav ska posten
    // läsas om och inte som rutin.
    const p = procurement({
      requirements: [
        requirement({ id: "reg", kind: "registration", registration: "f_tax" } as Partial<Requirement>),
      ],
    });
    const result = ready(build(p, [assessment("reg", "unknown")]));
    const item = result.items.find((i) => i.evidence.id === "registration_certificate");
    expect(item?.origin).toBe("requirement");
    expect(item?.becauseOf.map((l) => l.requirementId)).toContain("reg");
  });
});

/* ------------------------------------------------------------------ */

describe("kravens bedömning styr angelägenheten", () => {
  const withInsurance = procurement({ requirements: [requirement({ id: "ins" })] });

  it("markerar ett krav som inte är uppfyllt som en lucka", () => {
    const result = ready(build(withInsurance, [assessment("ins", "unmet")]));
    expect(result.items.find((i) => i.evidence.id === "insurance_certificate")?.urgency).toBe("gap");
  });

  it("räknar ett åtgärdbart krav som en lucka och inte som klart", () => {
    // "Går att åtgärda" är fortfarande arbete som ska göras före deadline.
    const result = ready(build(withInsurance, [assessment("ins", "remediable")]));
    expect(result.items.find((i) => i.evidence.id === "insurance_certificate")?.urgency).toBe("gap");
  });

  it("skiljer saknad uppgift från krav som brister", () => {
    const result = ready(build(withInsurance, [assessment("ins", "unknown")]));
    expect(result.items.find((i) => i.evidence.id === "insurance_certificate")?.urgency).toBe(
      "unproven",
    );
    expect(result.explanation).toContain("inte samma sak som att kravet inte är uppfyllt");
  });

  it("låter ett uppfyllt krav bli en handling att bifoga", () => {
    const result = ready(build(withInsurance, [assessment("ins", "met")]));
    expect(result.items.find((i) => i.evidence.id === "insurance_certificate")?.urgency).toBe(
      "confirm",
    );
  });

  it("låter strängast vinna när en handling svarar mot flera krav", () => {
    // Två certifieringskrav pekar på samma bevis. Att låta det uppfyllda
    // mildra bilden vore att dölja arbetet bakom ett medelvärde.
    const p = procurement({
      requirements: [
        requirement({ id: "c1", kind: "certification", certification: "a" } as Partial<Requirement>),
        requirement({ id: "c2", kind: "certification", certification: "b" } as Partial<Requirement>),
      ],
    });
    const result = ready(build(p, [assessment("c1", "met"), assessment("c2", "unmet")]));
    const item = result.items.find((i) => i.evidence.id === "certificate");
    expect(item?.urgency).toBe("gap");
    expect(item?.becauseOf).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */

describe("tid", () => {
  it("räknar startdagen bakåt från sista anbudsdag", () => {
    // Försäkringsbeviset tar 5 dagar; deadline 2026-09-30 ger 2026-09-25.
    const p = procurement({ requirements: [requirement({ id: "ins" })] });
    const result = ready(build(p, [assessment("ins", "unknown")]));
    const item = result.items.find((i) => i.evidence.id === "insurance_certificate");
    expect(item?.startBy).toBe("2026-09-25");
    expect(item?.overdue).toBe(false);
  });

  it("markerar en startdag som redan passerat", () => {
    const p = procurement({
      deadlineAt: "2026-08-23",
      requirements: [requirement({ id: "ins" })],
    });
    // 5 dagars ledtid mot deadline om en dag: startdagen låg i förrgår.
    const result = ready(build(p, [assessment("ins", "unknown")]));
    expect(result.items.find((i) => i.evidence.id === "insurance_certificate")?.overdue).toBe(true);
  });

  it("gissar aldrig fram en deadline", () => {
    const p = procurement({ deadlineAt: undefined, requirements: [requirement({ id: "ins" })] });
    const result = ready(build(p, [assessment("ins", "unknown")]));
    expect(result.items.every((i) => i.startBy === undefined)).toBe(true);
    expect(result.explanation).toContain("Sista anbudsdag saknas");
    // Ledtiden är fortfarande sann och användbar.
    expect(result.explanation).toContain("Ledtiderna");
  });

  it("sorterar längst ledtid först", () => {
    const p = procurement({
      requirements: [
        requirement({ id: "ins" }),
        requirement({ id: "cert", kind: "certification", certification: "x" } as Partial<Requirement>),
      ],
    });
    const result = ready(build(p, [assessment("ins", "unknown"), assessment("cert", "unknown")]));
    const lead = result.items.map((i) => i.evidence.typicalLeadTimeDays ?? Number.POSITIVE_INFINITY);
    expect(lead).toEqual([...lead].sort((a, b) => b - a));
    // Certifikatet, 10 dagar, ska stå före försäkringsbeviset, 5 dagar.
    const ids = result.items.map((i) => i.evidence.id);
    expect(ids.indexOf("certificate")).toBeLessThan(ids.indexOf("insurance_certificate"));
  });

  it("behandlar okänd ledtid som lång och inte som kort", () => {
    // Den som inte vet hur lång tid något tar bör börja med det. Baslinjen
    // innehåller en post utan känd ledtid; den ska stå överst.
    const result = ready(build(procurement()));
    expect(result.items[0]?.evidence.typicalLeadTimeDays).toBeUndefined();
    expect(result.unknownLeadTimes).toBeGreaterThan(0);
    expect(result.explanation).toContain("Okänd är inte kort");
  });

  it("pekar ut den ledtid som avgör när arbetet måste börja", () => {
    const p = procurement({
      requirements: [
        requirement({ id: "cert", kind: "certification", certification: "x" } as Partial<Requirement>),
      ],
    });
    const result = ready(build(p, [assessment("cert", "unmet")]));
    expect(result.longestLeadTimeDays).toBe(10);
    expect(result.explanation).toContain("10 dagar");
  });
});

/* ------------------------------------------------------------------ */

describe("katalogen", () => {
  it("har varje bevis som en kravtyp pekar på", () => {
    // En kopplingsmiss ger tyst en kortare lista. Det ska fällas här.
    for (const [kind, ids] of Object.entries(EVIDENCE_FOR_REQUIREMENT)) {
      for (const id of ids) {
        expect(EVIDENCE[id], `${kind} pekar på okänt bevis ${id}`).toBeDefined();
      }
    }
    for (const id of BASELINE_EVIDENCE) expect(EVIDENCE[id], id).toBeDefined();
  });

  it("har id som stämmer med sin nyckel", () => {
    for (const [key, item] of Object.entries(EVIDENCE)) expect(item.id).toBe(key);
  });

  it("säger var varje handling hämtas och vad den bevisar", () => {
    for (const item of Object.values(EVIDENCE)) {
      expect(item.where.length, item.id).toBeGreaterThan(20);
      expect(item.proves.length, item.id).toBeGreaterThan(20);
      expect(ISSUER_LABEL[item.issuer], item.id).toBeDefined();
    }
  });

  it("bär källa och kontrollflagga på varje rättslig grund", () => {
    const withBasis = Object.values(EVIDENCE).filter((i) => i.basis);
    expect(withBasis.length).toBeGreaterThan(0);
    for (const item of withBasis) {
      expect(item.basis?.source.document, item.id).toBeTruthy();
      expect(["verified", "unverified"]).toContain(item.basis?.verification);
    }
  });

  it("varnar för den föråldrade skatteblanketten", () => {
    // Skatteverket slutade lämna ut uppgift om restförd skatteskuld via
    // SKV 4820 den 6 mars 2019. Mallar begär den fortfarande, och en
    // checklista som tyst upprepar mallen skickar företaget efter fel papper.
    const tax = EVIDENCE.tax_status;
    expect(tax.pitfall).toContain("SKV 4820");
    expect(tax.pitfall).toContain("2019");
    expect(tax.issuer).toBe("buyer");
    expect(tax.basis?.rule).toContain("Kronofogden");
  });

  it("säger att egenförsäkran är preliminär", () => {
    expect(EVIDENCE.espd.pitfall).toMatch(/preliminär/i);
  });
});

/* ------------------------------------------------------------------ */

describe("ledtid i klartext", () => {
  it("skiljer okänd från noll", () => {
    expect(leadTimeLabel(undefined)).toBe("Ledtid okänd");
    expect(leadTimeLabel(0)).toBe("Går att få direkt");
  });

  it("böjer entalet", () => {
    expect(leadTimeLabel(1)).toBe("Ungefär en dag");
    expect(leadTimeLabel(5)).toBe("Ungefär 5 dagar");
  });
});

describe("startBy", () => {
  it("räknar bakåt över en månadsgräns", () => {
    expect(startBy("2026-09-03", 5)).toBe("2026-08-29");
  });

  it("räknar bakåt över ett årsskifte", () => {
    expect(startBy("2027-01-02", 3)).toBe("2026-12-30");
  });

  it("lämnar dagen orörd vid noll", () => {
    expect(startBy("2026-09-30", 0)).toBe("2026-09-30");
  });
});

/* ------------------------------------------------------------------ */

describe("listan är inte underlaget", () => {
  it("säger det i klartext på varje lista den bygger", () => {
    const result = ready(build(procurement({ requirements: [requirement({ id: "ins" })] })));
    const doc = result.caveats.find((c) => c.key === "documentsGovern");
    expect(doc?.text).toContain("går före");
  });

  it("lovar aldrig att anbudet blir godkänt", () => {
    const p = procurement({ requirements: [requirement({ id: "ins" })] });
    const result = ready(build(p, [assessment("ins", "met")]));
    const text = `${result.explanation} ${result.items.map((i) => i.evidence.proves).join(" ")}`;
    expect(text).not.toMatch(/då är du godkänd|garanterar|du kommer att vinna|räcker för att vinna/i);
  });
});
