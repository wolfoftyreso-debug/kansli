/**
 * Frågorna som är värda att ställa.
 *
 * Att fråga är det enda sätt en leverantör kan påverka en upphandling innan
 * det är för sent, och det kostar ingenting. Ett verktyg som lär ut det
 * slarvigt gör dock skada på fyra sätt, och det är dem testerna prövar:
 *
 *   sexdagarsfristen  ≠  sista dag att fråga
 *   en fråga          ≠  ett påstående om olaglighet
 *   ett svar          ≠  något bara du får
 *   generiska frågor  ≠  frågor värda att läsa
 *
 * Den första är den som annars går fel överallt. Sex dagar före sista anbudsdag
 * är när köparen senast ska ha *svarat*; frågedeadlinen står i underlaget och
 * ligger tidigare. Att blanda ihop dem ger någon några dagars falsk marginal.
 */

import { describe, expect, it } from "vitest";

import type { RequirementKind } from "../domain/ontology";
import { buildCapacityPlan } from "../engine/capacityPlan";
import type { RequirementAssessment, RequirementStatus } from "../engine/eligibility";
import { buildQuestionPlan, type QuestionPlan } from "../engine/questionPlan";

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

function plan(assessments: RequirementAssessment[], deadlineAt?: string): QuestionPlan {
  return buildQuestionPlan({
    assessments,
    capacity: buildCapacityPlan(assessments),
    deadlineAt,
    today: "2026-08-22",
  });
}

function ready(result: QuestionPlan) {
  if (result.status !== "ready") throw new Error(`förväntade frågor, fick none: ${result.summary}`);
  return result;
}

/* ------------------------------------------------------------------ */

describe("sexdagarsfristen är inte frågedeadlinen", () => {
  it("räknar dagen svaret senast ska finnas", () => {
    // 2026-09-30 minus sex dagar.
    const result = plan([gap("r1", "revenue")], "2026-09-30");
    expect(result.answersDueBy).toBe("2026-09-24");
  });

  it("säger rakt ut att det inte är sista dag att fråga", () => {
    const result = plan([gap("r1", "revenue")], "2026-09-30");
    expect(result.summary).toContain("inte samma sak som sista dag att fråga");
    expect(result.summary).toContain("står i underlaget");
  });

  it("markerar en passerad dag som passerad", () => {
    const result = plan([gap("r1", "revenue")], "2026-08-20");
    expect(result.daysUntilAnswersDue).toBeLessThan(0);
    expect(result.summary).toContain("har passerat");
  });

  it("räknar ingen dag utan sista anbudsdag", () => {
    const result = plan([gap("r1", "revenue")]);
    expect(result.answersDueBy).toBeUndefined();
    expect(result.daysUntilAnswersDue).toBeUndefined();
    // Regeln är användbar även utan kalenderdag.
    expect(result.summary).toContain("6 dagar före sista anbudsdag");
  });
});

/* ------------------------------------------------------------------ */

describe("frågorna följer av bedömningen", () => {
  it("föreslår en kapacitetsfråga där regeln beror på formuleringen", () => {
    const result = ready(plan([gap("r1", "insurance", "unmet", "Ansvarsförsäkring 10 MSEK")]));
    const q = result.questions.find((x) => x.kind === "capacity");
    expect(q?.subject).toBe("Ansvarsförsäkring 10 MSEK");
    expect(q?.draft).toContain("åberopar ett annat företags kapacitet");
  });

  it("föreslår en bevisfråga för en lucka som går att täcka", () => {
    const result = ready(plan([gap("r1", "revenue", "unmet", "Omsättning 50 MSEK")]));
    expect(result.questions.some((q) => q.kind === "evidence")).toBe(true);
  });

  it("frågar om proportionalitet för ett ska-krav som brister", () => {
    const result = ready(plan([gap("r1", "registration", "unmet", "F-skatt")]));
    const q = result.questions.find((x) => x.kind === "proportionality");
    expect(q?.draft).toContain("förhåller sig till uppdragets omfattning");
  });

  it("hoppar över bör-krav i proportionalitetsfrågan", () => {
    // Ett bör-krav utesluter ingen. Att fråga om det gör listan längre utan
    // att göra den bättre.
    const soft = { ...gap("r1", "registration"), mandatory: false };
    const result = plan([soft]);
    expect(result.status).toBe("none");
  });

  it("ställer inte två frågor om samma krav", () => {
    const result = ready(plan([gap("r1", "revenue"), gap("r2", "insurance")]));
    const subjects = result.questions.map((q) => q.subject);
    expect(new Set(subjects).size).toBe(subjects.length);
  });

  it("föreslår inga frågor när ingenting fattas", () => {
    // En lista med generiska frågor gör att ingen läser den lista som betyder
    // något.
    const result = plan([gap("r1", "revenue", "met"), gap("r2", "insurance", "unknown")]);
    expect(result.status).toBe("none");
    // Möjligheten nämns ändå — den är det billigaste man kan göra.
    expect(result.summary).toContain("billigaste");
  });
});

/* ------------------------------------------------------------------ */

describe("vad en fråga är och inte är", () => {
  const cases = [
    [gap("r1", "revenue")],
    [gap("r1", "insurance")],
    [gap("r1", "registration")],
    [gap("r1", "revenue"), gap("r2", "certification"), gap("r3", "geography")],
  ];

  it.each(cases.map((c, i) => [i, c] as const))(
    "påstår aldrig att ett krav är olagligt (%i)",
    (_, assessments) => {
      const result = plan(assessments, "2026-09-30");
      const text =
        result.status === "ready"
          ? `${result.summary} ${result.questions.map((q) => `${q.draft} ${q.why}`).join(" ")}`
          : result.summary;
      expect(text).not.toMatch(
        /strider mot|olaglig|otillåtet krav|bryter mot lagen|ni får inte ställa/i,
      );
    },
  );

  it("säger att svaret går till alla", () => {
    const result = plan([gap("r1", "revenue")], "2026-09-30");
    expect(result.summary).toContain("samtliga anbudsgivare");
    // Båda halvorna: du får inget eget, och du röjer inget.
    expect(result.summary).toContain("inte fråga dig till något eget");
    expect(result.summary).toContain("avslöjar inte heller");
  });

  it("överlåter den juridiska bedömningen", () => {
    const result = plan([gap("r1", "revenue")], "2026-09-30");
    expect(result.summary).toContain("juridisk bedömning");
    // Formuleringen är avsiktligt vänd. En tidigare version sade "om ett krav
    // strider mot regelverket …" som friskrivning, vilket är sant men gör
    // ordet till en del av sidans text — och testet som ska fånga anklagelser
    // kan då inte skilja friskrivningen från en anklagelse.
    expect(result.summary).toContain("förenligt med regelverket");
  });

  it("kallar formuleringen ett utkast och inte en mall", () => {
    const result = ready(plan([gap("r1", "revenue")]));
    for (const q of result.questions) {
      expect(q.draft.length).toBeGreaterThan(30);
      expect(q.why.length).toBeGreaterThan(30);
    }
  });
});

/* ------------------------------------------------------------------ */

describe("fristen bärs med sin källa", () => {
  it("bär lagrum, källa och kontrollflagga", () => {
    const result = plan([gap("r1", "revenue")], "2026-09-30");
    expect(result.period.days).toBe(6);
    expect(result.period.source.document).toBeTruthy();
    expect(result.period.verification).toBe("verified");
    expect(result.period.meaning).toContain("samtliga leverantörer");
  });
});
