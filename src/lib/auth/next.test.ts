import { describe, expect, it } from "vitest";
import { APP_NEXT_PATHS, safeNextPath } from "./next.ts";

describe("safeNextPath", () => {
  it("accepts the product and hub routes", () => {
    for (const path of APP_NEXT_PATHS) {
      expect(safeNextPath(path)).toBe(path);
    }
  });

  it("strips query and hash before matching", () => {
    expect(safeNextPath("/rita?issued=1")).toBe("/rita");
    expect(safeNextPath("/platform/events#latest")).toBe("/platform/events");
  });

  it("rejects open redirects and unknown paths", () => {
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath("https://evil.example/kansli")).toBeNull();
    expect(safeNextPath("//evil.example")).toBeNull();
    expect(safeNextPath("/\\evil")).toBeNull();
    expect(safeNextPath("/api/rita")).toBeNull();
    expect(safeNextPath("/idp")).toBeNull();
    expect(safeNextPath("/unknown")).toBeNull();
    expect(safeNextPath("/kansli/../rita")).toBeNull();
  });
});
