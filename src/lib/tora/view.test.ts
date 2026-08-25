import { describe, expect, it } from "vitest";
import { evaluationKindText, timingText, verdictText } from "./view.ts";

describe("evaluationKindText", () => {
  it("names the known models", () => {
    expect(evaluationKindText("lowest_price")).toBe("Lägsta pris");
    expect(evaluationKindText("best_price_quality_ratio")).toMatch(/pris och kvalitet/);
    expect(evaluationKindText("unknown_model")).toBe("unknown_model");
  });
});

describe("verdictText", () => {
  it("uses everyday Swedish instead of machine codes", () => {
    expect(verdictText("ELIGIBLE")).toBe("Ni kan lämna anbud");
    expect(verdictText("NOT_ELIGIBLE")).toBe("Ni kan inte lämna anbud");
    expect(verdictText("UNKNOWN")).toBe("Vi vet inte än");
  });
});

describe("timingText", () => {
  it("names the buckets in Swedish", () => {
    expect(timingText("open_now")).toBe("Öppen nu");
    expect(timingText("closed")).toBe("Stängd");
  });
});
