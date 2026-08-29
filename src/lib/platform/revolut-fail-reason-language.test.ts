import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { describeCategory } from "../ekonomi/revolut/errors.ts";

describe("Revolut vendor fail-reason language", () => {
  it("uses English-canonical category sentences like the UI catalog", () => {
    const errors = readFileSync("src/lib/ekonomi/revolut/errors.ts", "utf8");
    const tokens = readFileSync("src/lib/ekonomi/revolut/tokens.ts", "utf8");
    const client = readFileSync("src/lib/ekonomi/revolut/client.ts", "utf8");
    const revolut = readFileSync("src/lib/ekonomi/revolut.ts", "utf8");
    expect(describeCategory("configuration")).toBe("The Revolut configuration is not ready.");
    expect(describeCategory("network")).toBe("Network error toward Revolut.");
    expect(errors).toContain("Revolut did not recognise us.");
    expect(tokens).toContain("Revolut did not answer in time.");
    expect(tokens).toContain("The Revolut connection must be done again.");
    expect(tokens).toContain("Another renewal of the Revolut connection did not finish in time.");
    expect(client).toContain("Revolut rejected the call.");
    expect(client).toContain("Revolut answered without valid JSON.");
    expect(revolut).toContain("The key was not accepted, or Revolut is not answering right now.");
    expect(revolut).toContain(
      "The Revolut connection must be done again. Press Reconnect on Connections.",
    );
    expect(errors).not.toContain("Revolut-konfigurationen är inte klar.");
    expect(tokens).not.toContain("Nätverksfel mot Revolut.");
    expect(client).not.toContain("Revolut avvisade anropet.");
  });

  it("leaves event headlines, rail reasons and the Swedish UI catalog as written", () => {
    expect(readFileSync("src/lib/ekonomi/revolut.ts", "utf8")).toContain("Revolut-synk blockerad");
    expect(readFileSync("src/lib/ekonomi/revolut/tokens.ts", "utf8")).toContain(
      "Revolut behöver anslutas om",
    );
    expect(readFileSync("src/lib/ekonomi/rails.ts", "utf8")).toContain(
      "Revolut är inte anslutet. Anslut under Anslutningar",
    );
    expect(readFileSync("src/lib/i18n/sv.ts", "utf8")).toContain(
      "Revolut-konfigurationen är inte klar.",
    );
  });
});
