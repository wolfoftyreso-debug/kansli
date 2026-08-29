import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("identity chrome", () => {
  it("uses the locked facade tokens, not the old stone card", () => {
    const source = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");
    expect(source).toContain("background:#fbfbf9");
    expect(source).toContain("background:#101317");
    expect(source).toContain("border-radius:0");
    expect(source).toContain("PIXDRIFT");
    expect(source).toContain('name="color-scheme" content="light"');
    expect(source).not.toContain("#f6f3ee");
    expect(source).not.toContain("border-radius:16px");
    expect(source).not.toContain('class="mark"');
  });
});
