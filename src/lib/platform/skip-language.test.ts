import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

const WIRED = [
  "src/components/app/AppShell.tsx",
  "src/app/(site)/layout.tsx",
  "src/app/not-found.tsx",
  "src/app/irma/guest-chrome.tsx",
  "src/app/tyra/hub/[token]/page.tsx",
] as const;

describe("leftover skip-to-content language", () => {
  it("uses leftover chrome.skipToContent on leftover rooms like leftover not-found", () => {
    expect(t("en", "chrome.skipToContent")).toBe("Skip to content");
    expect(t("sv", "chrome.skipToContent")).toBe("Hoppa till innehållet");
    expect(readFileSync("src/components/app/SkipToContent.tsx", "utf8")).toContain(
      't(locale, "chrome.skipToContent")',
    );
    expect(readFileSync("src/components/app/SkipToContent.tsx", "utf8")).toContain('href="#main"');
    for (const file of WIRED) {
      expect(readFileSync(file, "utf8"), file).toContain("SkipToContent");
    }
    expect(readFileSync("src/components/app/Facade.tsx", "utf8")).toContain('id="main"');
    expect(readFileSync("src/app/irma/guest-chrome.tsx", "utf8")).toContain('id="main"');
    expect(readFileSync("src/components/app/Facade.tsx", "utf8")).not.toContain("SkipToContent");
  });

  it("leaves leftover marketing body and StatusIndicator words as written", () => {
    expect(readFileSync("src/app/(site)/how-it-works/page.tsx", "utf8")).toContain(
      "Locate the gap",
    );
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
