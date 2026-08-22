import { describe, expect, it } from "vitest";
import {
  createModelRouter,
  createDefaultRouter,
  DEFAULT_FAILOVER_ORDER,
  fakeProvider,
  FLAGSHIP_MODELS,
  providersFromEnv,
  type ModelResult,
  type Provider,
} from "../src/index.ts";

const throwing = (name: string): Provider => ({
  name,
  async complete() {
    throw new Error("nere");
  },
});

/** A provider that records the model it was asked to run. */
function capturing(name: string, flagshipModel: string): Provider & { seen: string[] } {
  const seen: string[] = [];
  return {
    name,
    flagshipModel,
    seen,
    async complete(req): Promise<ModelResult> {
      seen.push(req.model ?? "");
      return {
        kind: "inference",
        text: "",
        provider: name,
        model: req.model ?? "",
        promptVersion: null,
        usage: { inputTokens: null, outputTokens: null },
        finishReason: null,
        latencyMs: 0,
      };
    },
  };
}

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
        return {
          kind: "inference",
          text: "",
          provider: name,
          model: req.model ?? "",
          promptVersion: null,
          usage: { inputTokens: null, outputTokens: null },
          finishReason: null,
          latencyMs: 0,
        };
      },
    });
    const ai = createModelRouter({ providers: [p("a"), p("b")] });
    await ai.complete({ model: "b:gpt-x", messages: [] });
    expect(seen).toEqual(["b:gpt-x"]);
  });

  it("fails over through the order on error", async () => {
    const ai = createModelRouter({
      providers: [throwing("a"), fakeProvider("b")],
      order: ["a", "b"],
    });
    const res = await ai.complete({ model: "m", messages: [{ role: "user", content: "x" }] });
    expect(res.provider).toBe("b");
  });

  it("does not fail over when a provider is chosen explicitly", async () => {
    const ai = createModelRouter({ providers: [throwing("a"), fakeProvider("b")] });
    await expect(ai.complete({ model: "m", messages: [] }, { provider: "a" })).rejects.toThrow(
      /alla providers/,
    );
  });

  it("aggregates errors when everything fails", async () => {
    const ai = createModelRouter({ providers: [throwing("a"), throwing("b")] });
    await expect(ai.complete({ model: "m", messages: [] })).rejects.toThrow(/a: nere \| b: nere/);
  });
});

describe("heaviest models + Claude-first failover", () => {
  it("runs each provider's flagship when no model is named", async () => {
    const a = capturing("anthropic", "claude-fable-5");
    const ai = createModelRouter({ providers: [a] });
    const res = await ai.complete({ messages: [{ role: "user", content: "x" }] });
    expect(res.model).toBe("claude-fable-5");
    expect(a.seen).toEqual(["claude-fable-5"]);
  });

  it('treats "auto"/"flagship" as "use the heaviest model"', async () => {
    const a = capturing("anthropic", "claude-fable-5");
    const ai = createModelRouter({ providers: [a] });
    await ai.complete({ model: "auto", messages: [] });
    await ai.complete({ model: "flagship", messages: [] });
    expect(a.seen).toEqual(["claude-fable-5", "claude-fable-5"]);
  });

  it("falls down to the NEXT provider's own flagship on error (Claude first)", async () => {
    const a = throwing("anthropic");
    const b = capturing("openai", "gpt-5.6-sol");
    const ai = createModelRouter({ providers: [a, b], order: ["anthropic", "openai"] });
    const res = await ai.complete({ model: "auto", messages: [] });
    // Failover must NOT carry Claude's id to OpenAI — it uses OpenAI's flagship.
    expect(res.provider).toBe("openai");
    expect(b.seen).toEqual(["gpt-5.6-sol"]);
  });

  it("still honours an explicit provider:model without failover", async () => {
    const a = capturing("anthropic", "claude-fable-5");
    const b = capturing("openai", "gpt-5.6-sol");
    const ai = createModelRouter({ providers: [a, b] });
    await ai.complete({ model: "openai:o-custom", messages: [] });
    expect(a.seen).toEqual([]);
    expect(b.seen).toEqual(["o-custom"]);
  });
});

describe("providersFromEnv flagship defaults", () => {
  it("assigns the current heaviest model per provider", () => {
    const providers = providersFromEnv({
      env: {
        ANTHROPIC_API_KEY: "a",
        OPENAI_API_KEY: "o",
        GEMINI_API_KEY: "g",
        MOONSHOT_API_KEY: "m",
        AI_GATEWAY_API_KEY: "k",
      },
    });
    const flagship = Object.fromEntries(providers.map((p) => [p.name, p.flagshipModel]));
    expect(flagship).toEqual({
      anthropic: FLAGSHIP_MODELS.anthropic,
      openai: FLAGSHIP_MODELS.openai,
      gemini: FLAGSHIP_MODELS.gemini,
      kimi: FLAGSHIP_MODELS.kimi,
      gateway: FLAGSHIP_MODELS.gateway,
    });
  });

  it("lets env override a provider's model", () => {
    const [p] = providersFromEnv({
      env: { ANTHROPIC_API_KEY: "a", ANTHROPIC_MODEL: "claude-mythos-5" },
    });
    expect(p.flagshipModel).toBe("claude-mythos-5");
  });
});

describe("createDefaultRouter", () => {
  it("orders providers Claude-first and runs Claude's flagship by default", async () => {
    const bodies: Record<string, unknown> = {
      // Anthropic-shaped success response; anthropic is first in the chain.
      anthropic: { content: [{ type: "text", text: "hej" }], stop_reason: "end_turn" },
    };
    const fetchImpl = (async (input: Parameters<typeof fetch>[0]) => {
      const url = String(input);
      const body = url.includes("anthropic") ? bodies.anthropic : { choices: [] };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    const ai = createDefaultRouter({
      env: { OPENAI_API_KEY: "o", ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g" },
      fetchImpl,
    });
    // Claude first regardless of env insertion order.
    expect(ai.providers[0]).toBe("anthropic");
    const res = await ai.complete({ messages: [{ role: "user", content: "x" }] });
    expect(res.provider).toBe("anthropic");
    expect(res.model).toBe(FLAGSHIP_MODELS.anthropic);
  });

  it("exposes the canonical Claude-first order", () => {
    expect(DEFAULT_FAILOVER_ORDER[0]).toBe("anthropic");
  });
});

describe("providersFromEnv", () => {
  it("builds only providers with a configured key", () => {
    const names = providersFromEnv({
      env: { ANTHROPIC_API_KEY: "a", GEMINI_API_KEY: "g" },
    }).map((p) => p.name);
    expect(names).toEqual(["anthropic", "gemini"]);
  });

  it("adds Kimi (Moonshot) when MOONSHOT_API_KEY is set", () => {
    const names = providersFromEnv({
      env: { ANTHROPIC_API_KEY: "a", MOONSHOT_API_KEY: "m" },
    }).map((p) => p.name);
    expect(names).toEqual(["anthropic", "kimi"]);
  });

  it("adds an OpenAI-compatible gateway when AI_GATEWAY_API_KEY is set", () => {
    const names = providersFromEnv({ env: { AI_GATEWAY_API_KEY: "k" } }).map((p) => p.name);
    expect(names).toEqual(["gateway"]);
  });

  it("returns nothing without keys", () => {
    expect(providersFromEnv({ env: {} })).toHaveLength(0);
  });
});
