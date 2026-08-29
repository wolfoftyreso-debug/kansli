import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { t } from "../i18n/index.ts";
import { PERIODS } from "../ekonomi/series.ts";

describe("leftover Ekonomi period-label language", () => {
  it("uses English-canonical leftover period labels like leftover status maps", () => {
    expect(PERIODS.map((item) => item.label)).toEqual(["1W", "1M", "3M", "1Y", "Max"]);
    const source = readFileSync("src/lib/ekonomi/series.ts", "utf8");
    expect(source).not.toContain('label: "1V"');
    expect(source).not.toContain('label: "1Å"');
    expect(t("en", "ekonomi.board.period.1W")).toBe("1W");
    expect(t("en", "ekonomi.board.period.1Y")).toBe("1Y");
    expect(t("sv", "ekonomi.board.period.1W")).toBe("1V");
    expect(t("sv", "ekonomi.board.period.1Y")).toBe("1Å");
  });

  it("leaves leftover invoice-print copy as written", () => {
    expect(readFileSync("src/lib/ekonomi/reports.ts", "utf8")).toContain(
      "FAKTURA ${invoice.number}",
    );
    expect(readFileSync("src/lib/ekonomi/reports.ts", "utf8")).toContain("Förfaller:");
  });
});
