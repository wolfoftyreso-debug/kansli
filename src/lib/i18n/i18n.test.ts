import { describe, expect, it } from "vitest";
import { brand } from "../pixdrift/brand.ts";
import {
  DEFAULT_LOCALE,
  LOCALE_NATIVE_NAME,
  UI_LOCALES,
  localeFromAcceptLanguage,
  parseLocale,
} from "./locales.ts";
import { catalogs, messageKeys, t } from "./t.ts";

describe("locale registry", () => {
  it("ships English as the system language plus the decided set", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(UI_LOCALES[0]).toBe("en");
    expect(UI_LOCALES).toEqual(["en", "sv", "pl", "de", "es", "fr", "nl", "it", "no", "da", "fi"]);
    expect(brand.canonicalLocale).toBe("en");
    for (const locale of brand.locales) {
      expect(UI_LOCALES).toContain(locale);
    }
    expect(UI_LOCALES).toContain("pl");
  });

  it("parses tags and Accept-Language without inventing locales", () => {
    expect(parseLocale("sv-SE")).toBe("sv");
    expect(parseLocale("nb-NO")).toBe("no");
    expect(parseLocale("xx")).toBeNull();
    expect(localeFromAcceptLanguage("sv-SE,sv;q=0.9,en;q=0.8")).toBe("sv");
    expect(localeFromAcceptLanguage("pl,en;q=0.8")).toBe("pl");
    expect(localeFromAcceptLanguage("zh-CN,zh;q=0.9")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });

  it("keeps every catalog key in every shipped locale", () => {
    const keys = messageKeys();
    expect(keys.length).toBeGreaterThan(80);
    for (const locale of UI_LOCALES) {
      const catalog = catalogs[locale];
      for (const key of keys) {
        expect(catalog[key], `${locale} missing ${key}`).toBeTypeOf("string");
        expect(catalog[key].trim().length, `${locale} empty ${key}`).toBeGreaterThan(0);
      }
      expect(Object.keys(catalog).sort()).toEqual([...keys].sort());
    }
  });

  it("falls back to English and fills placeholders", () => {
    expect(t("en", "home.helloNamed", { name: "Landvex" })).toBe("Hello, Landvex");
    expect(t("en", "ops.kicker")).toBe("Ops desk");
    expect(t("sv", "ops.kicker")).toBe("Sambandscentral");
    expect(t("sv", "chrome.signIn")).toBe("Logga in");
    expect(t("pl", "chrome.language")).toBe("Język");
    expect(t("de", "chrome.signIn")).toBe("Anmelden");
    expect(t("es", "chrome.signIn")).toBe("Iniciar sesión");
    expect(LOCALE_NATIVE_NAME.pl).toBe("Polski");
    const blob = messageKeys()
      .flatMap((key) => UI_LOCALES.map((locale) => catalogs[locale][key]))
      .join(" ");
    expect(blob).not.toMatch(/\bAI\b/);
  });
});
