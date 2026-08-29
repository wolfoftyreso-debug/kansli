import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Identity authorize leftover-throw language", () => {
  it("uses English-canonical leftover authorize and logout copy like token exchange", () => {
    const server = readFileSync("packages/identity/src/server.ts", "utf8");
    expect(server).toContain("unknown client_id");
    expect(server).toContain("redirect_uri does not match");
    expect(server).toContain("You are signed out.");
    expect(server).toContain("function logoutPage");
    expect(server).toContain("IDP_LOGOUT_SENTENCE");
    expect(server).toContain("<title>${esc(IDP_LOGOUT_SENTENCE)}</title>");
    expect(server).toContain("logoutPage(requestLocale(request))");
    expect(server).toContain("function sendHtml");
    expect(server).toContain('IDP_HTML_CACHE_CONTROL = "no-store"');
    expect(readFileSync("src/app/api/auth/login/route.ts", "utf8")).toContain(
      '"cache-control": "no-store"',
    );
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

describe("Identity leftover CLI language", () => {
  it("uses English-canonical leftover onboard and listen copy", () => {
    const main = readFileSync("packages/identity/src/main.ts", "utf8");
    const onboard = readFileSync("packages/identity/scripts/onboard-module.ts", "utf8");
    expect(main).toContain("listening on");
    expect(main).not.toContain("lyssnar på");
    expect(onboard).toContain("Required: --id, at least one --redirect");
    expect(onboard).toContain("Registered client:");
    expect(onboard).toContain("shown ONCE — store in the secrets store");
    expect(onboard).not.toContain("Krävs:");
    expect(onboard).not.toContain("Registrerad klient");
    expect(onboard).not.toContain("visas EN gång");
  });

  it("prints the English-canonical usage and does not write a client", () => {
    const result = spawnSync(
      "pnpm",
      ["exec", "tsx", "packages/identity/scripts/onboard-module.ts"],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toContain("Required: --id, at least one --redirect");
    expect(result.stderr).not.toContain("Krävs:");
  });
});
