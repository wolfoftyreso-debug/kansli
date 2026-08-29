import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

const PAGES: readonly [string, string][] = [
  ["src/app/rita/[id]/page.tsx", "rita.metaDescription"],
  ["src/app/irma/[id]/page.tsx", "irma.metaDescription"],
  ["src/app/creditae/[id]/page.tsx", "creditae.metaDescription"],
  ["src/app/alva/[id]/page.tsx", "alva.metaDescription"],
  ["src/app/tora/[id]/page.tsx", "tora.metaDescription"],
  ["src/app/tora/calendar/page.tsx", "tora.metaDescription"],
  ["src/app/platform/mcp/page.tsx", "mcp.lead"],
  ["src/app/upphandling/bekraftelse/page.tsx", "intake.metaDescription"],
  ["src/app/maj/[id]/page.tsx", "maj.metaDescription"],
];

describe("leftover app documentation meta language", () => {
  it("uses leftover room keys as page descriptions like leftover MCP intros", () => {
    for (const [file, key] of PAGES) {
      expect(readFileSync(file, "utf8"), file).toContain(`description: t(locale, "${key}")`);
      expect(readFileSync(file, "utf8"), file).not.toContain("home.metaDescription");
    }
    expect(t("en", "rita.metaDescription")).toBe("RITA looks for tax savings in your books.");
    expect(t("sv", "irma.metaDescription")).not.toBe(t("en", "home.metaDescription"));
    expect(t("en", "mcp.lead")).toContain("The same sign-in as the rest.");
    expect(t("en", "intake.metaDescription")).toContain("Pick modules and sign a year.");
  });

  it("leaves leftover engine copy and StatusIndicator words as written", () => {
    expect(readFileSync("src/app/rita/[id]/page.tsx", "utf8")).toContain("rita.doc.metaTitle");
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
