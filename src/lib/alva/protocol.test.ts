import { describe, expect, it } from "vitest";
import { buildProtocolFacts } from "./protocol.ts";

describe("buildProtocolFacts", () => {
  it("exports filled-in facts and a null diagnosis", () => {
    const facts = buildProtocolFacts({
      item: {
        id: "case-1",
        complaint: "Oljud vid kallstart",
        vehicleRef: "TST001",
        area: "motor",
        mileageKm: 142000,
        desiredOutcome: "Hitta källan",
        technicianNotes: "Kallstart -3 C",
        status: "in_progress",
      },
      observations: [
        {
          id: "obs-1",
          label: "Oljud reproducerbart",
          value: "yes",
          recordedByRef: "user",
          recordedAt: "2026-08-24T10:00:00.000Z",
        },
      ],
      measurements: [
        {
          id: "m-1",
          name: "Kylvätska",
          value: 90,
          unit: "C",
          recordedByRef: "user",
          recordedAt: "2026-08-24T10:00:00.000Z",
        },
      ],
    });
    expect(facts.diagnosis).toBeNull();
    expect(facts.diagnosisEngine).toBeNull();
    expect(facts).not.toHaveProperty("findings");
    expect(facts.system).toBe("alva");
  });
});
