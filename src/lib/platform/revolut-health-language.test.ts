import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Revolut health language", () => {
  it("uses English-canonical health summaries like the API layer", () => {
    const health = readFileSync("src/lib/ekonomi/revolut/health.ts", "utf8");
    expect(health).toContain(
      "The key in the environment does not belong to the certificate at Revolut.",
    );
    expect(health).toContain("Not connected. The connection was removed.");
    expect(health).toContain("The connection must be done again in Revolut.");
    expect(health).toContain("Not configured. Certificate and id are missing.");
    expect(health).toContain("Waiting for approval in Revolut.");
    expect(health).toContain("Connected, but the certificate has expired.");
    expect(health).toContain("Connected. The certificate needs to be replaced soon.");
    expect(health).toContain("Connected. Renews automatically.");
    expect(health).toContain("Connected, but cannot renew automatically. Reconnect.");
    expect(health).toContain('return "Not connected."');
    expect(health).not.toContain("Inte konfigurerad. Certifikat och id saknas.");
    expect(health).not.toContain("Nyckeln i miljön hör inte till certifikatet hos Revolut.");
    expect(health).not.toContain("Ansluten. Förnyas automatiskt.");
  });

  it("leaves vendor fail reasons and event headlines as written", () => {
    expect(readFileSync("src/lib/ekonomi/revolut/errors.ts", "utf8")).toContain(
      "Revolut-konfigurationen är inte klar.",
    );
    expect(readFileSync("src/lib/ekonomi/revolut/health.ts", "utf8")).toContain(
      "Revolut-certifikatet behöver bytas",
    );
    expect(readFileSync("src/lib/ekonomi/revolut/tokens.ts", "utf8")).toContain(
      "Nätverksfel mot Revolut.",
    );
  });
});
