import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { remedy } from "../../../packages/tora/src/domain/remedies.ts";

describe("TORA unknown-remedy language", () => {
  it("uses English-canonical leftover throws like EventLog unknown keys", () => {
    const source = readFileSync("packages/tora/src/domain/remedies.ts", "utf8");
    expect(source).toContain("unknown remedy:");
    expect(source).not.toContain("okänt rättsmedel:");
  });

  it("throws the English-canonical sentence before returning empty", () => {
    expect(() => remedy("hittepå" as never)).toThrow(/unknown remedy: hittepå/);
    expect(remedy("review_procurement").key).toBe("review_procurement");
  });

  it("leaves leftover invoice-book throws and TORA remedy copy as written", () => {
    expect(readFileSync("src/lib/ekonomi/invoices.ts", "utf8")).toContain(
      "bara utkast kan utfärdas.",
    );
    expect(readFileSync("packages/tora/src/domain/remedies.ts", "utf8")).toContain(
      "skickats i tid räcker inte",
    );
  });
});
