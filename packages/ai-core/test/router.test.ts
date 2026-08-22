import { describe, expect, it } from "vitest";
import { createModelRouter, fakeProvider, providersFromEnv, type Provider } from "../src/index.ts";

const throwing = (name: string): Provider => ({
  name,
  async complete() {
    throw new Error("nere");
  },
});

describe("model router", () => {
  it("returns an inference with provenance", async () => {
    const ai = createModelRouter({ providers: [fakeProvider("fake")] });
    const res = await ai.complete({
      model: "m1",
      promptVersion: "v9",
      messages: [{ role: "user", content: "hej" }],
    });
    expect(res.kind).toBe("inference");
    expect(res.provider).toBe("fake");
    expect(res.model).toBe("m1");
    expect(res.promptVersion).toBe("v9");
    expect(res.text).toBe("echo:hej");
  });

  it("routes by provider prefix and strips it from the model", async () => {
    const seen: string[] = [];
    const p = (name: string): Provider => ({
      name,
      async complete(req) {
        seen.push(`${name}:${req.model}`);
        return { kind: "inference", text: "", provider: name, model: req.model, promptVersion: null, usage: { inputTokens: null, outputTokens: null }, finishReason: null, latencyMs: 0 };
      },
    });
    const ai = createModelRouter({ providers: [p("a"), p("b")] });
    await ai.complete({ model: "b:gpt-x", messages: [] });
    expect(seen).toEqual(["b:gpt-x"]);
  });

  it("fails over through the order on error", async () => {
    const ai = createModelRouter({ providers: [throwing("a"), fakeProvider("b")], order: ["a", "b"] });
    const res = await ai.complete({ model: "m", messages: [{ role: "user", content: "x" }] });
    expect(res.provider).toBe("b");
  });

  it("does not fail over when a provider is chosen explicitly", async () => {
    const ai = createModelRouter({ providers: [throwing("a"), fakeProvider("b")] });
    await expect(ai.complete({ model: "m", messages: [] }, { provider: "a" })).rejects.toThrow(/alla providers/);
  });

  it("aggregates errors when everything fails", async () => {
    const ai = createModelRouter({ providers: [throwing("a"), throwing("b")] });
    await expect(ai.complete({ model: "m", messages: [] })).rejects.toThrow(/a: nere \| b: nere/);
  });
});

describe("providersFromEnv", () => {
  it("builds only providers with a configured key", () => {
    const names = providersFromEnv({
      env: { ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g" },
    }).map((p) => p.name);
    expect(names).toEqual(["anthropic", "gemini"]);
  });

  it("adds an OpenAI-compatible gateway when AI_GATEWAY_API_KEY is set", () => {
    const names = providersFromEnv({ env: { AI_GATEWAY_API_KEY: "k" } }).map((p) => p.name);
    expect(names).toEqual(["gateway"]);
  });

  it("returns nothing without keys", () => {
    expect(providersFromEnv({ env: {} })).toHaveLength(0);
  });
});
