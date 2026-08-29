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

  it("leaves leftover contracts throws and TORA remedy copy as written", () => {
    expect(readFileSync("packages/contracts/src/index.ts", "utf8")).toContain(
      "får inte ha behörighet till kunddata:",
    );
    expect(readFileSync("packages/tora/src/domain/remedies.ts", "utf8")).toContain(
      "skickats i tid räcker inte",
    );
  });
});
