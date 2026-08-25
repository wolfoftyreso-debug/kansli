import { describe, expect, it } from "vitest";
import { uuidFromSeed } from "./uuid.ts";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("uuidFromSeed", () => {
  it("is stable and UUID-shaped", () => {
    const first = uuidFromSeed("rita:company:org-exempelbolaget");
    expect(first).toMatch(UUID_V4);
    expect(uuidFromSeed("rita:company:org-exempelbolaget")).toBe(first);
    expect(uuidFromSeed("rita:company:other")).not.toBe(first);
  });
});
