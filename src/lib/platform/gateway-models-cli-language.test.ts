import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const SCRIPT = "packages/ai-core/scripts/list-gateway-models.ts";
const MISSING =
  "No gateway credential found. Set AI_GATEWAY_API_KEY (or VERCEL_OIDC_TOKEN) in the environment/Secrets.";

describe("leftover gateway-models CLI language", () => {
  it("uses English-canonical leftover usage like vendor-check", () => {
    const source = readFileSync(SCRIPT, "utf8");
    expect(source).toContain(MISSING);
    expect(source).toContain("models available");
    expect(source).not.toContain("Ingen gateway-credential hittad.");
    expect(source).not.toContain("modeller tillgängliga");
  });

  it("prints the English-canonical sentence and does not call the gateway", () => {
    const env = { ...process.env };
    delete env.AI_GATEWAY_API_KEY;
    delete env.VERCEL_OIDC_TOKEN;
    const result = spawnSync("pnpm", ["exec", "tsx", SCRIPT], { encoding: "utf8", env });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(MISSING);
    expect(result.stdout).not.toContain("models available");
  });

  it("leaves leftover ping prompt as written", () => {
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
  });
});
