import { describe, expect, it } from "vitest";
import { formatSwedishDate, formatSwedishDateTime } from "./datetime.ts";

describe("Swedish clock copy", () => {
  it("renders a Stockholm wall time instead of a raw ISO string", () => {
    const iso = "2026-09-03T08:00:00.000Z";
    expect(formatSwedishDateTime(iso)).toMatch(/2026/);
    expect(formatSwedishDateTime(iso)).not.toContain("T");
    expect(formatSwedishDateTime(iso)).not.toContain("Z");
    expect(formatSwedishDate(iso)).toMatch(/september/i);
  });

  it("returns empty for garbage", () => {
    expect(formatSwedishDateTime("not-a-date")).toBe("");
  });
});
