import { describe, expect, it } from "vitest";
import { vendorChannels } from "./channels.ts";

describe("vendor channel inventory", () => {
  it("lists env names and never values", () => {
    const channels = vendorChannels({
      SEMRUSH_API_KEY: "sm-secret-must-not-leak",
      CREDITSAFE_USERNAME: "cs-user",
      CREDITSAFE_PASSWORD: "cs-pass",
      ELEVENLABS_API_KEY: "el-secret",
      OPENAI_API_KEY: "sk-secret",
    });
    const blob = JSON.stringify(channels);
    expect(blob).not.toContain("sm-secret");
    expect(blob).not.toContain("cs-user");
    expect(blob).not.toContain("cs-pass");
    expect(blob).not.toContain("el-secret");
    expect(blob).not.toContain("sk-secret");
    expect(channels.find((item) => item.id === "webintel")?.configured).toBe(true);
    expect(channels.find((item) => item.id === "credit")?.configured).toBe(true);
    expect(channels.find((item) => item.id === "tts")?.configured).toBe(true);
    expect(channels.find((item) => item.id === "openai")?.configured).toBe(true);
    expect(channels.find((item) => item.id === "webintel")?.env).toEqual(["SEMRUSH_API_KEY"]);
  });

  it("fails closed when the named secrets are missing", () => {
    const channels = vendorChannels({});
    expect(channels.find((item) => item.id === "webintel")?.configured).toBe(false);
    expect(channels.find((item) => item.id === "credit")?.configured).toBe(false);
    expect(channels.find((item) => item.id === "tts")?.configured).toBe(false);
    expect(channels.every((item) => item.env.length > 0)).toBe(true);
  });
});
