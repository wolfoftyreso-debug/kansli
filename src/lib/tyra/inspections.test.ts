import { describe, expect, it } from "vitest";
import { parseTreadReadings } from "./inspections.ts";

describe("parseTreadReadings", () => {
  it("requires all four positions", () => {
    const data = new FormData();
    data.set("tread_LF", "5,5");
    data.set("tread_RF", "5.2");
    data.set("tread_LR", "6");
    data.set("tread_RR", "6");
    expect(parseTreadReadings(data).map((row) => row.treadDepthMm)).toEqual([5.5, 5.2, 6, 6]);
  });

  it("refuses a partial set", () => {
    const data = new FormData();
    data.set("tread_LF", "5");
    expect(() => parseTreadReadings(data)).toThrow(/All four positions/);
  });

  it("refuses an invalid depth", () => {
    const data = new FormData();
    data.set("tread_LF", "-1");
    data.set("tread_RF", "5");
    data.set("tread_LR", "6");
    data.set("tread_RR", "6");
    expect(() => parseTreadReadings(data)).toThrow(/Invalid tread depth for LF/);
  });
});
