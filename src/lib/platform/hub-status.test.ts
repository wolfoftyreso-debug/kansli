import { describe, expect, it } from "vitest";
import { ritaStatusLine } from "./hub-status.ts";

const missing = { available: false, kind: "none" as const, modelReady: false, modelId: null };
const ready = {
  available: true,
  kind: "subprocess" as const,
  modelReady: true,
  modelId: "claude-fable-5",
};
const readyNoId = { available: true, kind: "subprocess" as const, modelReady: true, modelId: null };
const rulesOnly = {
  available: true,
  kind: "subprocess" as const,
  modelReady: false,
  modelId: null,
};

describe("ritaStatusLine", () => {
  it("says blocked when no engine is wired", () => {
    expect(ritaStatusLine(missing, "en")).toBe(
      "RITA analysis is missing. New analyses are stopped.",
    );
    expect(ritaStatusLine(missing, "sv")).toMatch(/saknas/);
  });

  it("does not name the vendor model on the customer line", () => {
    expect(ritaStatusLine(ready, "en")).toBe("RITA · rules + model");
    expect(ritaStatusLine(ready, "sv")).toBe("RITA · regler + modell");
    expect(ritaStatusLine(ready, "en")).not.toMatch(/claude/i);
  });

  it("does not say AI when the model id is missing", () => {
    expect(ritaStatusLine(readyNoId, "en")).toBe("RITA · rules + model");
    expect(ritaStatusLine(readyNoId, "sv")).toBe("RITA · regler + modell");
  });

  it("keeps the rules-only line when the model is not ready", () => {
    expect(ritaStatusLine(rulesOnly, "en")).toBe("RITA · fixed rules only");
    expect(ritaStatusLine(rulesOnly, "sv")).toBe("RITA · bara fasta regler");
  });
});
