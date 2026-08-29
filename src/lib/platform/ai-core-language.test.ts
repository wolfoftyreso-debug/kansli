import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createModelRouter } from "@pixdrift/ai-core";

describe("ai-core leftover-throw language", () => {
  it("uses English-canonical leftover router throws like API not_ready", () => {
    const router = readFileSync("packages/ai-core/src/router.ts", "utf8");
    expect(router).toContain("No providers are configured.");
    expect(router).toContain("unknown provider");
    expect(router).toContain("All providers failed:");
    expect(router).not.toContain("inga providers konfigurerade");
    expect(router).not.toContain("okänd provider");
    expect(router).not.toContain("alla providers misslyckades");
  });

  it("throws the English-canonical sentences before calling a vendor", async () => {
    const empty = createModelRouter({ providers: [], order: [] });
    await expect(empty.complete({ messages: [] })).rejects.toThrow(/No providers are configured/);

    const missing = createModelRouter({ providers: [], order: ["ghost"] });
    await expect(missing.complete({ messages: [] })).rejects.toThrow(
      /All providers failed: ghost: unknown provider/,
    );
  });

  it("leaves leftover invoice-book throws and the tyngsta alias as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
    expect(readFileSync("packages/ai-core/src/router.ts", "utf8")).toContain("tyngsta");
  });
});
