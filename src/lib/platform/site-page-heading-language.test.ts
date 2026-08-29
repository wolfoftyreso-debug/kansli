import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

describe("leftover site page-heading language", () => {
  it("uses English-canonical leftover marketing headings like leftover documentation titles", () => {
    expect(t("en", "site.why.title")).toBe("Why PIXDRIFT exists");
    expect(t("sv", "site.why.title")).toBe("Varför PIXDRIFT finns");
    expect(t("en", "site.why.eyebrow")).toBe("Philosophy");
    expect(t("sv", "site.why.eyebrow")).toBe("Filosofi");
    expect(t("en", "site.applications.title")).toBe("Where the in-between matters.");
    expect(t("sv", "site.applications.title")).toBe("Där mellanrummet spelar roll.");
    expect(t("en", "site.how.title")).toBe("A method, not a platform.");
    expect(t("sv", "site.how.title")).toBe("En metod, inte en plattform.");
    expect(t("en", "site.company.title", { name: "PIXDRIFT", company: "Landvex" })).toBe(
      "PIXDRIFT is developed by Landvex.",
    );
    expect(t("sv", "site.company.title", { name: "PIXDRIFT", company: "Landvex" })).toBe(
      "PIXDRIFT utvecklas av Landvex.",
    );
    expect(t("de", "site.how.title")).toBe("A method, not a platform.");

    expect(readFileSync("src/app/(site)/why/page.tsx", "utf8")).toContain(
      't(locale, "site.why.title")',
    );
    expect(readFileSync("src/app/(site)/why/page.tsx", "utf8")).not.toContain(
      'eyebrow="Philosophy"',
    );
    expect(readFileSync("src/app/(site)/how-it-works/page.tsx", "utf8")).toContain(
      't(locale, "site.how.title")',
    );
    expect(readFileSync("src/app/(site)/applications/page.tsx", "utf8")).toContain(
      't(locale, "site.applications.title")',
    );
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).toContain(
      't(locale, "site.company.title"',
    );
  });

  it("leaves leftover marketing body copy as written", () => {
    expect(readFileSync("src/app/(site)/why/page.tsx", "utf8")).toContain(
      "Organizations frequently do not need another enormous platform.",
    );
    expect(readFileSync("src/app/(site)/how-it-works/page.tsx", "utf8")).toContain(
      "Locate the gap",
    );
    expect(readFileSync("src/app/(site)/applications/page.tsx", "utf8")).toContain(
      "Public authorities & municipalities",
    );
    expect(readFileSync("src/lib/pixdrift/brand.ts", "utf8")).toContain(
      "The layer between systems.",
    );
  });
});
