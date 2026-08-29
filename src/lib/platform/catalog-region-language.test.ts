import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { catalogRegion, t } from "../i18n/index.ts";

describe("leftover catalog region language", () => {
  it("uses English-canonical leftover region labels like leftover catalog titles", () => {
    expect(catalogRegion("en", "Europe")).toBe("Europe");
    expect(catalogRegion("en", "United States")).toBe("United States");
    expect(catalogRegion("en", "Global")).toBe("Global");
    expect(catalogRegion("sv", "Europe")).toBe("Europa");
    expect(catalogRegion("sv", "United States")).toBe("Förenta staterna");
    expect(catalogRegion("sv", "Global")).toBe("Globalt");
    expect(catalogRegion("de", "Europe")).toBe("Europe");
    expect(t("en", "site.catalog.systemIndex", { index: "04" })).toBe("System 04");

    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("catalogRegion");
    expect(readFileSync("src/components/site/SystemCard.tsx", "utf8")).toContain(
      "site.catalog.systemIndex",
    );
    expect(readFileSync("src/components/site/SystemCard.tsx", "utf8")).not.toContain(
      "System {system.index}",
    );
    expect(readFileSync("src/app/(site)/systems/[slug]/page.tsx", "utf8")).toContain(
      "locale={locale}",
    );
  });

  it("leaves leftover systems.ts regions and StatusIndicator words as written", () => {
    const systems = readFileSync("src/lib/pixdrift/systems.ts", "utf8");
    expect(systems).toContain('"Europe"');
    expect(systems).toContain('"United States"');
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
