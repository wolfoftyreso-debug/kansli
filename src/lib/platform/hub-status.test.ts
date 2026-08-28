import { describe, expect, it } from "vitest";
import { ritaStatusLine } from "./hub-status.ts";

describe("ritaStatusLine", () => {
  it("says blocked when no engine is wired", () => {
    expect(
      ritaStatusLine({ available: false, kind: "none", modelReady: false, modelId: null }),
    ).toMatch(/saknas/);
  });

  it("names subprocess and model when ready", () => {
    expect(
      ritaStatusLine({
        available: true,
        kind: "subprocess",
        modelReady: true,
        modelId: "claude-fable-5",
      }),
    ).toBe("RITA · regler + claude-fable-5");
  });

  it("does not say AI when the model id is missing", () => {
    expect(
      ritaStatusLine({
        available: true,
        kind: "subprocess",
        modelReady: true,
        modelId: null,
      }),
    ).toBe("RITA · regler + modell");
  });
});
