import { describe, expect, it } from "vitest";
import { VEHICLE_CLASSES, vehicleClassIds, vehicleClassLabel } from "./vehicle-classes.ts";

describe("vehicle size classes", () => {
  it("names thirteen classes by size, not by model", () => {
    expect(vehicleClassIds()).toEqual([
      "smabil",
      "kompakt",
      "sedan",
      "kombi",
      "kompakt-suv",
      "stor-suv",
      "el-sedan",
      "el-suv",
      "minibuss",
      "skapbil",
      "stor-transport",
      "pickup",
      "liten-skapbil",
    ]);
    expect(vehicleClassLabel("stor-suv")).toBe("Stor SUV");
    expect(vehicleClassLabel("tiguan")).toBeNull();
    const blob = JSON.stringify(VEHICLE_CLASSES).toLowerCase();
    expect(blob).not.toContain("mova");
  });
});
