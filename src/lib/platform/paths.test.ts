import { describe, expect, it } from "vitest";
import { APP_HOME, appPath } from "./paths";

describe("appPath", () => {
  it("sends PIXDRIFT and identity to Kansli", () => {
    expect(appPath("pixdrift")).toBe(APP_HOME);
    expect(appPath("identity")).toBe("/kansli");
  });

  it("uses each system's own page", () => {
    expect(appPath("ekonomi")).toBe("/ekonomi");
    expect(appPath("tyra")).toBe("/tyra");
    expect(appPath("irma")).toBe("/irma");
    expect(appPath("tora")).toBe("/tora");
    expect(appPath("drift")).toBe("/platform/drift");
  });

  it("does not invent pages", () => {
    expect(appPath("swish")).toBeNull();
    expect(appPath("stripe")).toBeNull();
    expect(appPath("nora")).toBeNull();
    expect(appPath("mova")).toBeNull();
    expect(appPath("saga")).toBeNull();
  });
});
