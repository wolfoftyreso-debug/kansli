import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLOR_SCHEME, leftoverColorSchemeMeta, PAPER_HEX } from "./theme-chrome.ts";

describe("leftover theme chrome", () => {
  it("locks leftover light color-scheme and paper theme-color", () => {
    expect(PAPER_HEX).toBe("#fbfbf9");
    expect(COLOR_SCHEME).toBe("light");
    expect(leftoverColorSchemeMeta()).toBe('<meta name="color-scheme" content="light">');
    expect(readFileSync("src/app/globals.css", "utf8")).toContain("--color-paper: #fbfbf9");
    expect(readFileSync("src/app/globals.css", "utf8")).toContain("color-scheme: light");
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("export const viewport");
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("themeColor: PAPER_HEX");
    expect(readFileSync("src/app/layout.tsx", "utf8")).toContain("colorScheme: COLOR_SCHEME");
    expect(readFileSync("packages/identity/src/server.ts", "utf8")).toContain(
      'name="color-scheme" content="light"',
    );
    expect(readFileSync("src/app/api/auth/login/route.ts", "utf8")).toContain(
      "leftoverColorSchemeMeta",
    );
  });

  it("leaves leftover dark theme uninvented", () => {
    expect(COLOR_SCHEME).not.toBe("dark");
    expect(readFileSync("src/app/layout.tsx", "utf8")).not.toContain("prefers-color-scheme");
    expect(readFileSync("src/lib/platform/theme-chrome.ts", "utf8")).not.toContain(
      "prefers-color-scheme",
    );
  });
});
