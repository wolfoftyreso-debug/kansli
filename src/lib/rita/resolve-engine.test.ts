import { describe, expect, it } from "vitest";
import {
  ritaEngineSnapshot,
  ritaEngineUnavailableReason,
  resolveRitaEngine,
} from "./resolve-engine.ts";

describe("resolveRitaEngine", () => {
  it("returns null without HTTP config or a binary, and never invents a fake", () => {
    const previousUrl = process.env.RITA_ENGINE_URL;
    const previousToken = process.env.RITA_ENGINE_TOKEN;
    const previousBinary = process.env.RITA_ENGINE_BINARY;
    delete process.env.RITA_ENGINE_URL;
    delete process.env.RITA_ENGINE_TOKEN;
    delete process.env.RITA_ENGINE_BINARY;
    try {
      expect(resolveRitaEngine()).toBeNull();
      expect(ritaEngineUnavailableReason()).toMatch(/inte inkopplad/);
      expect(ritaEngineSnapshot({}).available).toBe(false);
      expect(ritaEngineSnapshot({}).kind).toBe("none");
    } finally {
      if (previousUrl) process.env.RITA_ENGINE_URL = previousUrl;
      else delete process.env.RITA_ENGINE_URL;
      if (previousToken) process.env.RITA_ENGINE_TOKEN = previousToken;
      else delete process.env.RITA_ENGINE_TOKEN;
      if (previousBinary) process.env.RITA_ENGINE_BINARY = previousBinary;
      else delete process.env.RITA_ENGINE_BINARY;
    }
  });

  it("reports a subprocess snapshot without echoing secrets", () => {
    const snap = ritaEngineSnapshot({
      RITA_ENGINE_BINARY: "src/lib/rita/fixtures/exempel-bokslut.txt",
      ANTHROPIC_API_KEY: "sk-ant-not-a-real-key",
    });
    expect(JSON.stringify(snap)).not.toContain("sk-ant");
    expect(snap.kind).toBe("subprocess");
    expect(snap.available).toBe(true);
    expect(snap.modelReady).toBe(true);
    expect(snap.modelId).toBeTruthy();
  });
});
