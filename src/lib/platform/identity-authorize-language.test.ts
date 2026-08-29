import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Identity authorize leftover-throw language", () => {
  it("uses English-canonical leftover authorize and logout copy like token exchange", () => {
    const server = readFileSync("packages/identity/src/server.ts", "utf8");
    expect(server).toContain("unknown client_id");
    expect(server).toContain("redirect_uri does not match");
    expect(server).toContain("You are signed out.");
    expect(server).not.toContain("okänd client_id");
    expect(server).not.toContain("redirect_uri matchar inte");
    expect(server).not.toContain("Du är utloggad.");
  });

  it("leaves leftover /halsa and demo login as written", () => {
    const server = readFileSync("packages/identity/src/server.ts", "utf8");
    expect(server).toContain('app.get("/halsa"');
    expect(server).toContain('lage: "drift"');
    expect(readFileSync("packages/identity/src/boot.ts", "utf8")).toContain(
      "demo@exempelbolaget.se",
    );
  });
});
