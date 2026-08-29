import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

function pageFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(path));
    else if (entry.name.endsWith(".tsx")) out.push(path);
  }
  return out;
}

describe("leftover SignInGate language", () => {
  it("requires leftover chrome.signIn like leftover skip chrome", () => {
    const gate = readFileSync("src/components/app/SignInGate.tsx", "utf8");
    expect(gate).toContain("actionLabel: string");
    expect(gate).not.toContain('?? "Sign in"');
    expect(t("en", "chrome.signIn")).toBe("Sign in");
    expect(t("sv", "chrome.signIn")).toBe("Logga in");
    const gates = pageFiles("src/app").filter((file) =>
      readFileSync(file, "utf8").includes("<SignInGate"),
    );
    expect(gates.length).toBeGreaterThan(20);
    for (const file of gates) {
      expect(readFileSync(file, "utf8"), file).toContain('t(locale, "chrome.signIn")');
    }
  });

  it("leaves leftover StatusIndicator words and marketing body as written", () => {
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).toContain("Why we build");
  });
});
