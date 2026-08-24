import { describe, expect, it } from "vitest";
import { ritaCompletedObservationBody } from "./handlers.ts";

describe("ritaCompletedObservationBody", () => {
  it("names the company, count and whether the model ran", () => {
    expect(
      ritaCompletedObservationBody({
        companyName: "Exempelbolaget AB",
        findingCount: 7,
        modelConfigured: true,
      }),
    ).toBe("Exempelbolaget AB: 7 fynd. Språkmodell var kopplad.");
  });

  it("does not invent a count or a model when the event omitted them", () => {
    expect(ritaCompletedObservationBody({ companyName: "Bolaget" })).toBe(
      "Bolaget: fyndunderlag klart. Bara regelverket.",
    );
  });
});
