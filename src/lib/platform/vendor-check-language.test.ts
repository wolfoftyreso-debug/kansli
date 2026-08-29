import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const VENDOR_KEYS = [
  "AI_GATEWAY_API_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GEMINI_API_KEY",
  "ELEVENLABS_API_KEY",
  "CREDITSAFE_USERNAME",
  "CREDITSAFE_PASSWORD",
  "SEMRUSH_API_KEY",
  "ELKS_API_USERNAME",
  "ELKS_API_PASSWORD",
  "RESEND_API_KEY",
  "MAPBOX_ACCESS_TOKEN",
  "APOLLO_API_KEY",
];

describe("leftover vendor-check CLI language", () => {
  it("uses English-canonical leftover statuses like ops-lookup", () => {
    const source = readFileSync("scripts/vendor-check.ts", "utf8");
    expect(source).toContain('status: "OK" | "FAIL" | "MISSING"');
    expect(source).toContain('missing ${missing.join(", ")}');
    expect(source).toContain("VENDOR API CHECK");
    expect(source).toContain("Summary:");
    expect(source).toContain("the key is valid");
    expect(source).not.toContain("SAKNAS");
    expect(source).not.toContain("saknar ");
    expect(source).not.toContain("VENDOR-API-KONTROLL");
    expect(source).not.toContain("Summering:");
    expect(source).not.toContain("nyckeln är giltig");
  });

  it("prints MISSING in English and does not call vendors when keys are unset", () => {
    const env = { ...process.env };
    for (const key of VENDOR_KEYS) delete env[key];
    const result = spawnSync("pnpm", ["exec", "tsx", "scripts/vendor-check.ts"], {
      encoding: "utf8",
      env,
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("VENDOR API CHECK");
    expect(result.stdout).toContain("MISSING");
    expect(result.stdout).toContain("missing AI_GATEWAY_API_KEY");
    expect(result.stdout).toMatch(/Summary: 0 OK · 0 FAIL · \d+ MISSING/);
    expect(result.stdout).not.toContain("SAKNAS");
  });

  it("leaves leftover ping prompt and Revolut cert script as written", () => {
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
    expect(readFileSync("scripts/revolut/generate-certificate.sh", "utf8")).toContain(
      "okänt argument:",
    );
  });
});
