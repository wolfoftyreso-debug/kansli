import { describe, expect, it } from "vitest";
import { eventHeadline, eventLine } from "./event-copy.ts";

describe("eventHeadline", () => {
  it("prefers title, then headline, companyName, reason", () => {
    expect(eventHeadline({ title: "Underlag", headline: "2 öppna" })).toBe("Underlag");
    expect(eventHeadline({ headline: "2 öppna" })).toBe("2 öppna");
    expect(eventHeadline({ companyName: "Exempelbolaget AB" })).toBe("Exempelbolaget AB");
    expect(eventHeadline({ reason: "engine_unavailable" })).toBe("engine_unavailable");
    expect(eventHeadline({ analysisId: "abc" })).toBeNull();
  });

  it("falls back to subject then kind", () => {
    expect(eventLine({ kind: "rita.analysis.completed", payload: {}, subjectRef: "rita:analysis:1" })).toBe(
      "rita:analysis:1",
    );
    expect(eventLine({ kind: "rita.analysis.completed", payload: {}, subjectRef: null })).toBe(
      "rita.analysis.completed",
    );
  });
});
