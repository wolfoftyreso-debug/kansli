import { describe, expect, it } from "vitest";
import { canRunDemoIntel } from "./intel.ts";

describe("BRITT demo intel", () => {
  it("stays on the house org", () => {
    expect(canRunDemoIntel("pixdrift:org:org-exempelbolaget")).toBe(true);
    expect(canRunDemoIntel("pixdrift:org:org-holm-dack-umea-ab")).toBe(false);
  });
});
