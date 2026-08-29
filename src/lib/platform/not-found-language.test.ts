import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";

describe("leftover not-found language", () => {
  it("uses leftover IdP error keys like leftover app documentation descriptions", () => {
    const root = readFileSync("src/app/not-found.tsx", "utf8");
    const site = readFileSync("src/app/(site)/not-found.tsx", "utf8");
    const chrome = readFileSync("src/components/app/NotFoundChrome.tsx", "utf8");
    expect(chrome).toContain('t(locale, "idp.errorTitle")');
    expect(chrome).toContain('t(locale, "idp.errorHeading")');
    expect(chrome).toContain('t(locale, "idp.home")');
    expect(root).toContain("NotFoundChrome");
    expect(root).toContain("Facade");
    expect(root).toContain("appRoomRobots");
    expect(site).toContain("NotFoundChrome");
    expect(site).toContain("appRoomRobots");
    expect(site).not.toContain("Facade");
    expect(root).not.toContain("This page could not be found");
    expect(site).not.toContain("This page could not be found");
    expect(chrome).not.toContain("home.metaDescription");
    expect(t("en", "idp.errorHeading")).toBe("The request cannot be processed");
    expect(t("sv", "idp.errorHeading")).toBe("Begäran kan inte behandlas");
    expect(t("sv", "idp.errorTitle")).toBe("Fel");
  });

  it("leaves leftover marketing body and StatusIndicator words as written", () => {
    expect(readFileSync("src/app/(site)/company/page.tsx", "utf8")).toContain("Why we build");
    expect(readFileSync("src/components/site/indicators.tsx", "utf8")).toContain("{status}");
  });
});
