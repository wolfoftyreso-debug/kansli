import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

describe("leftover breadcrumb language", () => {
  it("uses English-canonical leftover breadcrumb chrome like leftover catalog titles", () => {
    expect(t("en", "chrome.breadcrumb")).toBe("Breadcrumb");
    expect(t("sv", "chrome.breadcrumb")).toBe("Sökväg");
    expect(t("de", "chrome.breadcrumb")).toBe("Breadcrumb");
    expect(readFileSync("src/app/(site)/systems/[slug]/page.tsx", "utf8")).toContain(
      't(locale, "chrome.breadcrumb")',
    );
    expect(readFileSync("src/app/(site)/systems/[slug]/page.tsx", "utf8")).not.toContain(
      'aria-label="Breadcrumb"',
    );
    expect(readFileSync("src/components/app/ProductCrumb.tsx", "utf8")).toContain(
      't(locale, "chrome.breadcrumb")',
    );
    expect(readFileSync("src/components/app/ProductCrumb.tsx", "utf8")).not.toContain(
      'aria-label="Plats"',
    );
  });

  it("leaves leftover StatusIndicator words and systems.ts titles as written", () => {
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
    expect(readFileSync("src/lib/pixdrift/systems.ts", "utf8")).toContain('title: "Purpose"');
  });
});
