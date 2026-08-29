import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ErrorChrome } from "../../components/app/ErrorChrome.tsx";
import { localeFromCookieHeader, t } from "../i18n/index.ts";

describe("leftover error language", () => {
  it("uses leftover IdP error keys like leftover not-found chrome", () => {
    const chrome = readFileSync("src/components/app/ErrorChrome.tsx", "utf8");
    const root = readFileSync("src/app/error.tsx", "utf8");
    const site = readFileSync("src/app/(site)/error.tsx", "utf8");
    const global = readFileSync("src/app/global-error.tsx", "utf8");
    expect(chrome).toContain('t(locale, "idp.errorTitle")');
    expect(chrome).toContain('t(locale, "idp.errorHeading")');
    expect(chrome).toContain('t(locale, "tasks.genericError")');
    expect(chrome).toContain('t(locale, "chrome.tryAgain")');
    expect(chrome).toContain('t(locale, "idp.home")');
    expect(chrome).not.toContain("error.message");
    expect(root).toContain("ErrorChrome");
    expect(root).toContain("Facade");
    expect(site).toContain("ErrorChrome");
    expect(site).not.toContain("Facade");
    expect(global).toContain("ErrorChrome");
    expect(t("en", "chrome.tryAgain")).toBe("Try again");
    expect(t("sv", "chrome.tryAgain")).toBe("Försök igen");
    expect(t("sv", "tasks.genericError")).toBe("Något gick fel.");
  });

  it("renders leftover error chrome from pd_locale cookie like leftover skip chrome", () => {
    expect(localeFromCookieHeader("pd_locale=sv; other=1")).toBe("sv");
    expect(localeFromCookieHeader("other=1")).toBe("en");
    expect(localeFromCookieHeader(undefined)).toBe("en");
    const en = renderToStaticMarkup(createElement(ErrorChrome, { locale: "en" }));
    const sv = renderToStaticMarkup(createElement(ErrorChrome, { locale: "sv", reset: () => {} }));
    expect(en).toContain("The request cannot be processed");
    expect(en).toContain("Something went wrong.");
    expect(en).toContain("home page");
    expect(en).not.toContain("Try again");
    expect(sv).toContain("Begäran kan inte behandlas");
    expect(sv).toContain("Något gick fel.");
    expect(sv).toContain("Försök igen");
    expect(sv).toContain("startsida");
  });

  it("leaves leftover marketing body and StatusIndicator words as written", () => {
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).toContain("Why we build");
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
