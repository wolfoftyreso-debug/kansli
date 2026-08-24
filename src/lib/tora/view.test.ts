import { describe, expect, it } from "vitest";
import { evaluationKindText } from "./view.ts";

describe("evaluationKindText", () => {
  it("names the known models", () => {
    expect(evaluationKindText("lowest_price")).toBe("Lägsta pris");
    expect(evaluationKindText("best_price_quality_ratio")).toMatch(/pris och kvalitet/);
    expect(evaluationKindText("unknown_model")).toBe("unknown_model");
  });
});
