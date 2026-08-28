import { describe, expect, it } from "vitest";
import { brand } from "../pixdrift/brand.ts";
import {
  DEFAULT_LOCALE,
  LOCALE_NATIVE_NAME,
  UI_LOCALES,
  localeFromAcceptLanguage,
  parseLocale,
} from "./locales.ts";
import {
  catalogs,
  ekonomiConnSlot,
  ekonomiInvoiceStatus,
  ekonomiPayStatus,
  ekonomiRevolutError,
  ekonomiRevolutStatus,
  ekonomiSmsStatus,
  irmaStatus,
  irmaVerification,
  messageKeys,
  t,
  toraCalKind,
  tyraCaseStatus,
  tyraIntentLabel,
  tyraStepStatus,
} from "./t.ts";

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
    expect(t("en", "ready.heading")).toBe("First customer");
    expect(t("sv", "ready.heading")).toBe("Första kunden");
    expect(t("en", "events.heading")).toBe("Event log");
    expect(t("sv", "events.heading")).toBe("Händelselogg");
    expect(t("en", "intake.heading")).toBe("Pick modules and sign a year");
    expect(t("sv", "intake.submit")).toBe("Teckna året och få fakturorna");
    expect(t("en", "intake.inbox.heading")).toBe("Registrations");
    expect(t("sv", "intake.inbox.heading")).toBe("Registreringar");
    expect(t("en", "tyra.openCase")).toBe("Open case");
    expect(t("sv", "tyra.openCase")).toBe("Öppna ärende");
    expect(tyraIntentLabel("en", "TIRE_SWAP_APPOINTMENT")).toBe("Wheel change");
    expect(tyraIntentLabel("sv", "TIRE_SWAP_APPOINTMENT")).toBe("Hjulskifte");
    expect(tyraCaseStatus("en", "OPEN")).toBe("Open");
    expect(tyraCaseStatus("sv", "OPEN")).toBe("Öppet");
    expect(t("en", "tyra.case.bookSale")).toBe("Book sale");
    expect(t("sv", "tyra.case.bookSale")).toBe("Boka sälj");
    expect(tyraStepStatus("en", "TODO")).toBe("To do");
    expect(tyraStepStatus("sv", "TODO")).toBe("Att göra");
    expect(t("en", "ekonomi.desk.newSale")).toBe("New sale");
    expect(t("sv", "ekonomi.desk.newSale")).toBe("Nytt sälj");
    expect(ekonomiInvoiceStatus("en", "draft")).toBe("Draft");
    expect(ekonomiInvoiceStatus("sv", "draft")).toBe("Utkast");
    expect(ekonomiSmsStatus("en", "SENT")).toBe("Sent");
    expect(ekonomiSmsStatus("sv", "SENT")).toBe("Skickat");
    expect(t("en", "ekonomi.doc.lines")).toBe("Lines");
    expect(t("sv", "ekonomi.doc.lines")).toBe("Rader");
    expect(ekonomiPayStatus("en", "received")).toBe("Received");
    expect(ekonomiPayStatus("sv", "received")).toBe("Mottagen");
    expect(t("en", "ekonomi.stmt.heading")).toBe("Statements");
    expect(t("sv", "ekonomi.stmt.heading")).toBe("Kontoutdrag");
    expect(t("en", "ekonomi.rep.heading")).toBe("VAT and receivables");
    expect(t("sv", "ekonomi.vouch.heading")).toBe("Verifikat");
    expect(ekonomiConnSlot("en", "revolut_business")).toBe("Revolut Business (statements)");
    expect(ekonomiConnSlot("sv", "revolut_business")).toBe("Revolut Business (kontoutdrag)");
    expect(t("en", "ekonomi.rev.heading")).toBe("Revolut Business");
    expect(t("sv", "ekonomi.rev.signInTitle")).toBe("Logga in för att ansluta Revolut");
    expect(ekonomiRevolutStatus("en", "not_configured")).toBe("Not configured");
    expect(ekonomiRevolutStatus("sv", "not_configured")).toBe("Inte konfigurerad");
    expect(ekonomiRevolutError("en", "configuration")).toBe(
      "The Revolut configuration is not ready.",
    );
    expect(ekonomiRevolutError("sv", "configuration")).toBe(
      "Revolut-konfigurationen är inte klar.",
    );
    expect(t("en", "irma.create")).toBe("Create and show link");
    expect(t("sv", "irma.create")).toBe("Skapa och visa länk");
    expect(irmaStatus("en", "signed")).toBe("Confirmed");
    expect(irmaStatus("sv", "signed")).toBe("Bekräftat");
    expect(irmaVerification("en", 1)).toBe("Digital confirmation (level 1)");
    expect(irmaVerification("sv", 0)).toBe("Ingen bekräftelse (informationsunderlag)");
    expect(t("en", "irma.guest.opened")).toBe("I have opened the document");
    expect(t("sv", "irma.guest.readHeading")).toBe("Det här ska du läsa");
    expect(t("en", "tora.saveProfile")).toBe("Save company profile");
    expect(t("sv", "tora.share")).toBe("Dela läget");
    expect(t("en", "tora.cal.heading")).toBe("Calendar");
    expect(t("sv", "tora.cal.thisWeek")).toBe("Den här veckan");
    expect(toraCalKind("en", "deadline")).toBe("Bid deadline");
    expect(toraCalKind("sv", "deadline")).toBe("Sista anbudsdag");
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
