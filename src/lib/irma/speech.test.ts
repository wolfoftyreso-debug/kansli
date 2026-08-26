import { describe, expect, it } from "vitest";
import { DEFAULT_CLAUSES } from "./clauses.ts";
import { agreementSpeechText } from "./speech.ts";

describe("agreement speech text", () => {
  it("reads title, counterparty, body and clauses without inventing law", () => {
    const text = agreementSpeechText({
      title: "Serviceavtal",
      counterparty: "Holm AB",
      body: "Byt däck i oktober.",
      clauses: [...DEFAULT_CLAUSES],
    });
    expect(text).toContain("Serviceavtal");
    expect(text).toContain("Holm AB");
    expect(text).toContain("Byt däck i oktober.");
    expect(text).toContain("inte en juridiskt kvalificerad e-signatur");
  });
});
