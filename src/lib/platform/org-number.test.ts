import { describe, expect, it } from "vitest";
import { DEMO_ORG_NUMBER } from "../rita/request.ts";
import { makeOrgNumber, normalizeOrgNumber, orgNumberError } from "./org-number.ts";

describe("swedish org number", () => {
  it("accepts the RITA demo number and rejects a broken checksum", () => {
    expect(orgNumberError(DEMO_ORG_NUMBER)).toBeNull();
    expect(normalizeOrgNumber("5560160680")).toBe(DEMO_ORG_NUMBER);
    expect(orgNumberError("556000-0000")).toMatch(/does not check out/);
    expect(orgNumberError("5561")).toMatch(/ten digits/);
    expect(orgNumberError("")).toMatch(/is missing/);
  });

  it("builds unique valid numbers for a fleet", () => {
    const numbers = Array.from({ length: 20 }, (_, i) => makeOrgNumber(i + 1));
    expect(new Set(numbers).size).toBe(20);
    for (const value of numbers) {
      expect(orgNumberError(value)).toBeNull();
    }
  });
});
