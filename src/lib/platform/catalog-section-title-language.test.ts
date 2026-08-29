import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogSectionTitle, t } from "../i18n/index.ts";

describe("leftover catalog section-title language", () => {
  it("uses English-canonical leftover section titles like leftover catalog bodies", () => {
    expect(catalogSectionTitle("en", "01")).toBe("Purpose");
    expect(catalogSectionTitle("en", "04")).toBe("How it works");
    expect(catalogSectionTitle("en", "06")).toBe("Applications");
    expect(catalogSectionTitle("en", "09")).toBe("Documentation");
    expect(catalogSectionTitle("en", "10")).toBe("Availability");
    expect(catalogSectionTitle("sv", "01")).toBe("Syfte");
    expect(catalogSectionTitle("sv", "04")).toBe("Så fungerar det");
    expect(catalogSectionTitle("sv", "06")).toBe("Applikationer");
    expect(catalogSectionTitle("sv", "09")).toBe("Dokumentation");
    expect(catalogSectionTitle("sv", "10")).toBe("Tillgänglighet");
    expect(catalogSectionTitle("de", "04")).toBe("How it works");
    expect(t("en", "site.catalog.systemIndex", { index: "04" })).toBe("System 04");
    expect(t("sv", "site.catalog.systemIndex", { index: "04" })).toBe("System 04");
    expect(t("en", "site.catalog.documentation")).toBe("Documentation");
    expect(t("sv", "site.catalog.documentation")).toBe("Dokumentation");

    const page = readFileSync("src/app/(site)/systems/[slug]/page.tsx", "utf8");
    expect(page).toContain("catalogSectionTitle(locale, section.no)");
    expect(page).toContain("site.catalog.systemIndex");
    expect(page).toContain("site.catalog.documentation");
    expect(page).not.toContain("{section.title}");
  });

  it("leaves leftover systems.ts titles and StatusIndicator words as written", () => {
    const systems = readFileSync("src/lib/pixdrift/systems.ts", "utf8");
    expect(systems).toContain('title: "Purpose"');
    expect(systems).toContain('title: "How it works"');
    expect(systems).not.toContain('title: "Syfte"');
    expect(systems).toContain('status: "Operational"');
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
