/**
 * Processguiden.
 *
 * Guiden är pedagogik, och pedagogik som har fel är värre än ingen alls — den
 * som lär sig något felaktigt agerar på det. Testerna prövar därför tre saker,
 * i den ordningen:
 *
 * **Att innehållet finns för varje förfarande.** En upphandling vars procedur
 * saknar guide skulle rendera en tom ruta där det viktigaste borde stå.
 *
 * **Att inget dateras som inte är publicerat.** Ett uppskattat datum ser ut att
 * gå att planera efter, och det är den dyraste sortens fel här.
 *
 * **Att avtalsspärren aldrig försvinner.** Den är det enda tidsfönstret där ett
 * fel går att stoppa, och den som får veta om den först när tilldelningsbeslutet
 * kommer har redan förlorat dagar av tio.
 */

import { describe, expect, it } from "vitest";

import { buildWalkthrough, daysBetween } from "../engine/procedureGuide";
import {
  GLOSSARY,
  PROCEDURE_GUIDES,
  STANDSTILL_ELECTRONIC,
  STANDSTILL_OTHER,
  SUPPLEMENTARY_INFORMATION,
} from "../domain/procedure";
import { demoGraph } from "../data/seed";
import type { Procurement, ProcedureKind } from "../domain/ontology";

const ALL_PROCEDURES: ProcedureKind[] = [
  "open",
  "selective",
  "negotiated",
  "simplified",
  "direct_award",
  "framework_call_off",
  "dynamic_purchasing_system",
  "concession",
];

const procurement = (id: string): Procurement => {
  const found = demoGraph.procurements.find((p) => p.id === id);
  if (!found) throw new Error(`saknar upphandling ${id}`);
  return found;
};

/* ------------------------------------------------------------------ */

describe("varje förfarande har en guide", () => {
  it.each(ALL_PROCEDURES)("%s har namn, sammanfattning och steg", (kind) => {
    const guide = PROCEDURE_GUIDES[kind];
    expect(guide.kind).toBe(kind);
    expect(guide.name.length).toBeGreaterThan(0);
    expect(guide.summary.length).toBeGreaterThan(30);
    expect(guide.stages.length).toBeGreaterThanOrEqual(3);
  });

  it.each(ALL_PROCEDURES)("%s har unika steg-id", (kind) => {
    // Dubbletter skulle göra positionsberäkningen tvetydig: `findIndex` tar den
    // första, och pekaren skulle fastna i fel steg.
    const ids = PROCEDURE_GUIDES[kind].stages.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ALL_PROCEDURES)("%s säger vem som agerar i varje steg", (kind) => {
    for (const stage of PROCEDURE_GUIDES[kind].stages) {
      expect(["buyer", "supplier", "court"]).toContain(stage.actor);
      expect(stage.what.length).toBeGreaterThan(20);
    }
  });

  it("ger företaget något att göra i sitt första egna steg", () => {
    // En guide som bara beskriver vad köparen gör är en lärobok, inte ett
    // verktyg.
    //
    // Kravet ställs på det *första* steg där leverantören agerar, och inte på
    // "något steg någonstans". Skillnaden är inte formell: varje annonserat
    // förfarande ärver samma slutsteg — tilldelning, avtalsspärr — och de bär
    // vägledning. Ett svagare test blev därför uppfyllt av arvet, och den
    // procedurspecifika hjälpen kunde tas bort utan att något gick rött. Det
    // upptäcktes genom att ta bort den.
    for (const kind of ALL_PROCEDURES) {
      const firstOwn = PROCEDURE_GUIDES[kind].stages.find((s) => s.actor === "supplier");
      expect(firstOwn, `${kind} har inget steg där leverantören agerar`).toBeDefined();
      expect(firstOwn?.yourMove, `${kind}: ${firstOwn?.title} saknar vägledning`).toBeTruthy();
    }
  });
});

/* ------------------------------------------------------------------ */

describe("avtalsspärren", () => {
  it("finns i varje annonserat förfarande", () => {
    // Direktupphandling och avrop saknar den med rätta; de annonserade får den
    // aldrig tappas ur.
    const announced: ProcedureKind[] = [
      "open",
      "selective",
      "negotiated",
      "simplified",
      "concession",
    ];
    for (const kind of announced) {
      const ids = PROCEDURE_GUIDES[kind].stages.map((s) => s.id);
      expect(ids, `${kind}`).toContain("standstill");
    }
  });

  it("bär fristen, dess innebörd och en verifierad källa", () => {
    expect(STANDSTILL_ELECTRONIC.days).toBe(10);
    expect(STANDSTILL_OTHER.days).toBe(15);
    for (const period of [STANDSTILL_ELECTRONIC, STANDSTILL_OTHER, SUPPLEMENTARY_INFORMATION]) {
      expect(period.verification).toBe("verified");
      expect(period.source.url).toContain("upphandlingsmyndigheten.se");
      expect(period.source.retrievedAt).toBeTruthy();
    }
  });

  it("säger att rätten går förlorad när fönstret stängs", () => {
    const stage = PROCEDURE_GUIDES.open.stages.find((s) => s.id === "standstill");
    // Att fristen finns är inte poängen. Poängen är att den är sista chansen.
    expect(stage?.pitfall).toMatch(/inte längre att överklaga/);
    expect(stage?.yourMove).toMatch(/förvaltningsrätten/);
  });
});

/* ------------------------------------------------------------------ */

describe("placerar upphandlingen i processen", () => {
  const today = "2026-08-21";

  it("markerar anbudstiden som pågående medan anbudsdagen är kvar", () => {
    // Belysning: öppet förfarande, annonserad 2026-07-28, sista anbudsdag
    // 2026-09-04 — alltså mitt i anbudstiden på testets datum.
    const walkthrough = buildWalkthrough(procurement("proc:tyreso-belysning"), today);
    expect(walkthrough.guide.kind).toBe("open");
    const current = walkthrough.stages.find((s) => s.position === "current");
    expect(current?.stage.id).toBe("tender_period");
    // Annonseringen ligger bakom oss, tilldelningen framför.
    const byId = Object.fromEntries(walkthrough.stages.map((s) => [s.stage.id, s.position]));
    expect(byId.announcement).toBe("done");
    expect(byId.award_decision).toBe("upcoming");
  });

  it("pekar på kontaktsteget i en direktupphandling", () => {
    // Direktupphandling har ingen anbudstid att vara mitt i — det som pågår är
    // att köparen väljer vem som tillfrågas.
    const walkthrough = buildWalkthrough(procurement("proc:haninge-forskola"), today);
    expect(walkthrough.guide.kind).toBe("direct_award");
    expect(walkthrough.stages.find((s) => s.position === "current")?.stage.id).toBe("contact");
  });

  it("räknar dagar till sista anbudsdag i ett öppet förfarande", () => {
    const belysning = procurement("proc:tyreso-belysning");
    const walkthrough = buildWalkthrough(belysning, today);
    const tender = walkthrough.stages.find((s) => s.stage.id === "tender_period");
    expect(tender?.date).toBe(belysning.deadlineAt);
    expect(tender?.daysUntil).toBe(daysBetween(today, belysning.deadlineAt!));
  });

  it("daterar inte steg som saknar publicerat datum", () => {
    const walkthrough = buildWalkthrough(procurement("proc:tyreso-belysning"), today);
    const award = walkthrough.stages.find((s) => s.stage.id === "award_decision");
    // Att uppskatta tilldelningsdatum ur anbudsdagen vore att uppfinna en
    // tidplan köparen aldrig lämnat.
    expect(award?.date).toBeUndefined();
    expect(award?.dateUnknownReason).toBeTruthy();
  });

  it("markerar inget steg som pågående för en förutsagd upphandling", () => {
    const predicted: Procurement = {
      ...procurement("proc:tyreso-belysning"),
      status: "predicted",
      announcedAt: undefined,
      deadlineAt: undefined,
    };
    const walkthrough = buildWalkthrough(predicted, today);
    expect(walkthrough.stages.every((s) => s.position === "unknown")).toBe(true);
    expect(walkthrough.whereYouAre).toContain("räcker inte för att se");
    // Guiden ska ändå visa hela förfarandet — det är då man hinner förbereda sig.
    expect(walkthrough.stages.length).toBeGreaterThanOrEqual(5);
  });

  it("flyttar pekaren till prövning när anbudsdagen passerat", () => {
    const belysning = procurement("proc:tyreso-belysning");
    // Dagen efter sista anbudsdag: anbuden är inne och ska prövas.
    const walkthrough = buildWalkthrough(belysning, "2026-09-05");
    expect(walkthrough.stages.find((s) => s.position === "current")?.stage.id).toBe("examination");
  });

  it("låter köparens status väga tyngre än våra datum", () => {
    // Status är vad köparen sagt; datum är vad vi räknat ut. Säger de emot
    // varandra vinner det köparen sagt.
    const underReview: Procurement = {
      ...procurement("proc:tyreso-belysning"),
      status: "under_review",
    };
    const walkthrough = buildWalkthrough(underReview, today);
    expect(walkthrough.stages.find((s) => s.position === "current")?.stage.id).toBe("standstill");
    expect(walkthrough.whereYouAre).toContain("överklagad");
  });

  it("beskriver läget i klarspråk med dagar kvar", () => {
    const walkthrough = buildWalkthrough(procurement("proc:region-dis-laddinfra"), today);
    expect(walkthrough.whereYouAre).toMatch(/Pågående steg/);
  });
});

/* ------------------------------------------------------------------ */

describe("ordlistan", () => {
  it("förklarar de ord systemet självt använder", () => {
    const terms = GLOSSARY.map((e) => e.term.toLowerCase()).join(" ");
    for (const word of [
      "avtalsspärr",
      "överprövning",
      "avrop",
      "rangordning",
      "utvärderingspris",
    ]) {
      expect(terms, word).toContain(word);
    }
  });

  it("säger varför varje ord spelar roll för en anbudsgivare", () => {
    // En ordlista som bara definierar är en ordbok. Den här ska förklara vad
    // ordet betyder *för dig*.
    const withoutReason = GLOSSARY.filter((e) => !e.whyItMatters);
    expect(withoutReason.map((e) => e.term)).toEqual([]);
  });

  it("håller förklaringarna i klarspråk", () => {
    for (const entry of GLOSSARY) {
      expect(entry.plain.length, entry.term).toBeGreaterThan(20);
      // En förklaring som är längre än stycket den förklarar är ingen förklaring.
      expect(entry.plain.length, entry.term).toBeLessThan(260);
    }
  });
});
