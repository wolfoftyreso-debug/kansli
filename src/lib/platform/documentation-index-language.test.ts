import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { terminology, terminologyTerm } from "../pixdrift/terminology.ts";

describe("leftover documentation-index language", () => {
  it("uses English-canonical leftover documentation chrome like leftover catalog titles", () => {
    expect(t("en", "site.doc.eyebrow")).toBe("Documentation");
    expect(t("en", "site.doc.title")).toBe("Documentation is part of the product.");
    expect(t("en", "site.doc.area.gettingStarted")).toBe("Getting started");
    expect(t("en", "site.doc.terminology")).toBe("Terminology");
    expect(t("sv", "site.doc.eyebrow")).toBe("Dokumentation");
    expect(t("sv", "site.doc.title")).toBe("Dokumentationen är en del av produkten.");
    expect(t("sv", "site.doc.area.gettingStarted")).toBe("Komma igång");
    expect(t("sv", "site.doc.terminology")).toBe("Terminologi");
    expect(t("de", "site.doc.title")).toBe("Documentation is part of the product.");

    const page = readFileSync("src/app/(site)/documentation/page.tsx", "utf8");
    expect(page).toContain('t(locale, "site.doc.title")');
    expect(page).toContain('t(locale, "site.doc.eyebrow")');
    expect(page).not.toContain('eyebrow="Documentation"');
    expect(page).not.toContain("Documentation is part of the product.");
  });

  it("uses leftover approved terminology translations for leftover term labels", () => {
    const system = terminology.find((item) => item.term === "System");
    const operator = terminology.find((item) => item.term === "Operator");
    expect(system).toBeDefined();
    expect(operator).toBeDefined();
    expect(terminologyTerm("en", system!)).toBe("System");
    expect(terminologyTerm("sv", system!)).toBe("System");
    expect(terminologyTerm("es", system!)).toBe("Sistema");
    expect(terminologyTerm("fi", system!)).toBe("Järjestelmä");
    expect(terminologyTerm("en", operator!)).toBe("Operator");
    expect(terminologyTerm("es", operator!)).toBe("Operator");
    expect(readFileSync("src/app/(site)/documentation/page.tsx", "utf8")).toContain(
      "terminologyTerm(locale, item)",
    );
    expect(readFileSync("src/app/(site)/documentation/page.tsx", "utf8")).toContain(
      "{item.definition}",
    );
  });

  it("leaves leftover terminology terms and StatusIndicator words as written", () => {
    expect(readFileSync("src/lib/pixdrift/terminology.ts", "utf8")).toContain('term: "System"');
    expect(readFileSync("src/lib/pixdrift/terminology.ts", "utf8")).toContain(
      "A product developed and operated under PIXDRIFT.",
    );
    expect(readFileSync("src/lib/pixdrift/systems.ts", "utf8")).toContain('status: "Operational"');
    expect(readFileSync("src/app/(site)/documentation/page.tsx", "utf8")).toContain(
      "StatusIndicator",
    );
    expect(readFileSync("src/app/(site)/documentation/page.tsx", "utf8")).not.toContain(
      'pd-label">{s.status}',
    );
  });
});
