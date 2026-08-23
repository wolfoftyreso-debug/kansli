import { describe, expect, it } from "vitest";
import { resolveRitaEngine, ritaEngineUnavailableReason } from "./resolve-engine.ts";

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
      expect(ritaEngineUnavailableReason()).toMatch(/RITA_ENGINE_URL/);
    } finally {
      if (previousUrl) process.env.RITA_ENGINE_URL = previousUrl;
      else delete process.env.RITA_ENGINE_URL;
      if (previousToken) process.env.RITA_ENGINE_TOKEN = previousToken;
      else delete process.env.RITA_ENGINE_TOKEN;
      if (previousBinary) process.env.RITA_ENGINE_BINARY = previousBinary;
      else delete process.env.RITA_ENGINE_BINARY;
    }
  });
});
