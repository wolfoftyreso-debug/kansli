import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("leftover doc-intel CLI language", () => {
  it("uses English-canonical leftover console copy like gateway-models", () => {
    const gap = readFileSync("packages/doc-intel/scripts/gap-report.ts", "utf8");
    const demo = readFileSync("packages/doc-intel/scripts/demo-gap-report.ts", "utf8");
    expect(gap).toContain("ALVA Documentation Gap Report written to");
    expect(gap).toContain("Capabilities:");
    expect(gap).toContain("Undocumented (headline):");
    expect(gap).toContain("Not verifiable from here (NOT_PRESENT):");
    expect(gap).toContain("WARNING:");
    expect(gap).toContain("orphan coverage entries");
    expect(demo).toContain("ALVA Product Demo gap report written to");
    expect(demo).toContain("Scenes:");
    expect(demo).toContain("Cannot be demonstrated from here:");
    expect(gap).not.toContain("skriven till");
    expect(gap).not.toContain("Kapabiliteter:");
    expect(gap).not.toContain("Odokumenterat");
    expect(gap).not.toContain("VARNING:");
    expect(demo).not.toContain("skriven till");
    expect(demo).not.toContain("Scener:");
    expect(demo).not.toContain("Kan inte demonstreras härifrån");
  });

  it("leaves leftover rendered report headings as written", () => {
    expect(readFileSync("packages/doc-intel/src/gaps.ts", "utf8")).toContain(
      "## Kan inte verifieras härifrån (produktkällan saknas i detta repo)",
    );
    expect(readFileSync("packages/doc-intel/src/demo.ts", "utf8")).toContain(
      "## Kan inte demonstreras (underliggande funktionalitet saknas här)",
    );
  });

  it("leaves leftover ping prompt as written", () => {
    expect(readFileSync("scripts/vendor-check.ts", "utf8")).toContain(
      "Svara med ett enda ord: pong. Inget annat.",
    );
  });
});
