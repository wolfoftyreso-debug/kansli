import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingChrome } from "../../components/app/LoadingChrome.tsx";
import { t } from "../i18n/index.ts";

describe("leftover loading language", () => {
  it("uses leftover common.loading like leftover TaskBoard chrome", () => {
    const chrome = readFileSync("src/components/app/LoadingChrome.tsx", "utf8");
    const root = readFileSync("src/app/loading.tsx", "utf8");
    const site = readFileSync("src/app/(site)/loading.tsx", "utf8");
    expect(chrome).toContain('t(locale, "common.loading")');
    expect(root).toContain("LoadingChrome");
    expect(root).toContain("Facade");
    expect(root).toContain("SkipToContent");
    expect(site).toContain("LoadingChrome");
    expect(site).not.toContain("Facade");
    expect(t("en", "common.loading")).toBe("Loading…");
    expect(t("sv", "common.loading")).toBe("Laddar…");
    expect(readFileSync("src/app/TaskBoard.tsx", "utf8")).toContain('t(locale, "common.loading")');
  });

  it("renders leftover loading chrome from leftover locale", () => {
    const en = renderToStaticMarkup(createElement(LoadingChrome, { locale: "en" }));
    const sv = renderToStaticMarkup(createElement(LoadingChrome, { locale: "sv" }));
    expect(en).toContain("Loading…");
    expect(sv).toContain("Laddar…");
    expect(en).not.toContain("Laddar…");
  });

  it("leaves leftover marketing body and StatusIndicator words as written", () => {
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).toContain("Why we build");
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
