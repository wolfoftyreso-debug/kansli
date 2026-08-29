import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ANALYSIS_STATUS_LABELS } from "../rita/analyses.ts";
import { CASE_STATUS_LABELS, STEP_STATUS_LABELS } from "../tyra/cases.ts";

describe("leftover status-label language", () => {
  it("uses English-canonical leftover maps like ALVA and the i18n catalog", () => {
    expect(CASE_STATUS_LABELS.OPEN).toBe("Open");
    expect(CASE_STATUS_LABELS.IN_PROGRESS).toBe("In progress");
    expect(CASE_STATUS_LABELS.BLOCKED).toBe("Blocked");
    expect(CASE_STATUS_LABELS.DONE).toBe("Done");
    expect(CASE_STATUS_LABELS.CANCELLED).toBe("Cancelled");
    expect(STEP_STATUS_LABELS.TODO).toBe("To do");
    expect(STEP_STATUS_LABELS.DOING).toBe("In progress");
    expect(ANALYSIS_STATUS_LABELS.requested).toBe("Requested");
    expect(ANALYSIS_STATUS_LABELS.completed).toBe("Done");
    expect(ANALYSIS_STATUS_LABELS.blocked).toBe("Blocked");

    const tyra = readFileSync("src/lib/tyra/cases.ts", "utf8");
    const rita = readFileSync("src/lib/rita/analyses.ts", "utf8");
    expect(tyra).not.toContain('OPEN: "Öppet"');
    expect(tyra).not.toContain('TODO: "Att göra"');
    expect(rita).not.toContain('requested: "Begärd"');
  });

  it("leaves leftover invoice-book status words as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain('draft: "Utkast"');
    expect(readFileSync("src/lib/irma/status.ts", "utf8")).toContain('return "Bekräftat"');
  });
});
