/**
 * Provider adapters. Each is a thin, dependency-free client over the provider's
 * REST API using `fetch` (injectable for tests), mapped to the unified
 * `ModelResult`. OpenAI-compatible covers both OpenAI and an OpenAI-shaped
 * gateway (e.g. Vercel AI Gateway).
 */

import {
  type Message,
  type ModelRequest,
  type ModelResult,
  type ModelUsage,
  type Provider,
  ProviderError,
} from "./types.ts";

type FetchImpl = typeof fetch;

/**
 * The heaviest / most capable model per provider, current as of 2026-08-22.
 * These are the defaults used when a request does not name a model. Each is
 * overridable via env (see env.ts) so ops can pin or bump without a code change.
 */
export const FLAGSHIP_MODELS = {
  /** Anthropic's "most powerful" model. */
  anthropic: "claude-fable-5",
  /** OpenAI flagship (alias of gpt-5.6). */
  openai: "gpt-5.6-sol",
  /** Google's most advanced model for complex tasks. */
  gemini: "gemini-3.1-pro-preview",
  /** Moonshot's flagship Kimi model. */
  kimi: "kimi-k3",
  /**
   * Vercel AI Gateway default: a `provider/model` slug (dots for versions),
   * Claude-first and heaviest-tier. Overridable via AI_GATEWAY_MODEL, and the
   * live catalog (100+ models) should be confirmed with `listModels()` /
   * `pnpm --filter @pixdrift/ai-core models` before pinning a specific slug.
   */
  gateway: "anthropic/claude-opus-4.6",
} as const;

function pickModel(model: string | undefined, flagship: string): string {
  return model && model.length > 0 ? model : flagship;
}

function splitSystem(messages: Message[]): { system: string | undefined; rest: Message[] } {
  const system = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  return { system: system || undefined, rest: messages.filter((m) => m.role !== "system") };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; ms: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, ms: Date.now() - start };
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function result(
  provider: string,
  req: ModelRequest,
  text: string,
  usage: ModelUsage,
  finishReason: string | null,
  ms: number,
): ModelResult {
  return {
    kind: "inference",
    text,
    provider,
    model: req.model ?? "",
    promptVersion: req.promptVersion ?? null,
    usage,
    finishReason,
    latencyMs: ms,
  };
}

// --- Anthropic (Claude) ------------------------------------------------------
export interface AnthropicOptions {
  apiKey: string;
  baseUrl?: string;
  version?: string;
  /** Override the heaviest model; defaults to FLAGSHIP_MODELS.anthropic. */
  model?: string;
  fetchImpl?: FetchImpl;
}

export function anthropicProvider(opts: AnthropicOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://api.anthropic.com";
  const flagshipModel = opts.model ?? FLAGSHIP_MODELS.anthropic;
  return {
    name: "anthropic",
    flagshipModel,
    async complete(req) {
      const model = pickModel(req.model, flagshipModel);
      const { system, rest } = splitSystem(req.messages);
      const { value: res, ms } = await timed(() =>
        doFetch(`${baseUrl}/v1/messages`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": opts.apiKey,
            "anthropic-version": opts.version ?? "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: req.maxTokens ?? 1024,
            temperature: req.temperature,
            system,
            messages: rest.map((m) => ({ role: m.role, content: m.content })),
          }),
        }),
      );
      if (!res.ok) throw new ProviderError("anthropic", res.status, await safeText(res));
      const json = (await res.json()) as {
        content?: { type: string; text?: string }[];
        usage?: { input_tokens?: number; output_tokens?: number };
        stop_reason?: string;
      };
      const text = (json.content ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.text ?? "")
        .join("");
      return result(
        "anthropic",
        { ...req, model },
        text,
        {
          inputTokens: json.usage?.input_tokens ?? null,
          outputTokens: json.usage?.output_tokens ?? null,
        },
        json.stop_reason ?? null,
        ms,
      );
    },
  };
}

// --- OpenAI-compatible (OpenAI / gateway) -----------------------------------
export interface OpenAICompatibleOptions {
  apiKey: string;
  baseUrl?: string;
  name?: string;
  /** Override the heaviest model; defaults to FLAGSHIP_MODELS.openai. */
  model?: string;
  fetchImpl?: FetchImpl;
}

export function openAICompatibleProvider(opts: OpenAICompatibleOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://api.openai.com/v1";
  const name = opts.name ?? "openai";
  const flagshipModel = opts.model ?? FLAGSHIP_MODELS.openai;
  return {
    name,
    flagshipModel,
    async listModels() {
      const res = await doFetch(`${baseUrl}/models`, {
        headers: { authorization: `Bearer ${opts.apiKey}` },
      });
      if (!res.ok) throw new ProviderError(name, res.status, await safeText(res));
      const json = (await res.json()) as {
        data?: { id?: string }[];
        models?: { id?: string }[];
      };
      const rows = json.data ?? json.models ?? [];
      return rows
        .map((m) => m.id ?? "")
        .filter(Boolean)
        .sort();
    },
    async complete(req) {
      const model = pickModel(req.model, flagshipModel);
      const { value: res, ms } = await timed(() =>
        doFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
          body: JSON.stringify({
            model,
            messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
            max_tokens: req.maxTokens,
            temperature: req.temperature,
          }),
        }),
      );
      if (!res.ok) throw new ProviderError(name, res.status, await safeText(res));
      const json = (await res.json()) as {
        choices?: { message?: { content?: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };
      const choice = json.choices?.[0];
      return result(
        name,
        { ...req, model },
        choice?.message?.content ?? "",
        {
          inputTokens: json.usage?.prompt_tokens ?? null,
          outputTokens: json.usage?.completion_tokens ?? null,
        },
        choice?.finish_reason ?? null,
        ms,
      );
    },
  };
}

// --- Moonshot (Kimi) — OpenAI-compatible ------------------------------------
export interface MoonshotOptions {
  apiKey: string;
  baseUrl?: string;
  /** Override the heaviest model; defaults to FLAGSHIP_MODELS.kimi. */
  model?: string;
  fetchImpl?: FetchImpl;
}

/** Kimi via Moonshot's OpenAI-compatible API. Provider name is "kimi". */
export function moonshotProvider(opts: MoonshotOptions): Provider {
  return openAICompatibleProvider({
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl ?? "https://api.moonshot.ai/v1",
    name: "kimi",
    model: opts.model ?? FLAGSHIP_MODELS.kimi,
    fetchImpl: opts.fetchImpl,
  });
}

// --- Google Gemini -----------------------------------------------------------
export interface GeminiOptions {
  apiKey: string;
  baseUrl?: string;
  /** Override the heaviest model; defaults to FLAGSHIP_MODELS.gemini. */
  model?: string;
  fetchImpl?: FetchImpl;
}

export function geminiProvider(opts: GeminiOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  const flagshipModel = opts.model ?? FLAGSHIP_MODELS.gemini;
  return {
    name: "gemini",
    flagshipModel,
    async complete(req) {
      const model = pickModel(req.model, flagshipModel);
      const { system, rest } = splitSystem(req.messages);
      const url = `${baseUrl}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
      const { value: res, ms } = await timed(() =>
        doFetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents: rest.map((m) => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: req.maxTokens, temperature: req.temperature },
          }),
        }),
      );
      if (!res.ok) throw new ProviderError("gemini", res.status, await safeText(res));
      const json = (await res.json()) as {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
      };
      const cand = json.candidates?.[0];
      const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("");
      return result(
        "gemini",
        { ...req, model },
        text,
        {
          inputTokens: json.usageMetadata?.promptTokenCount ?? null,
          outputTokens: json.usageMetadata?.candidatesTokenCount ?? null,
        },
        cand?.finishReason ?? null,
        ms,
      );
    },
  };
}

// --- Fake (dev/test) ---------------------------------------------------------
export function fakeProvider(
  name = "fake",
  responder: (req: ModelRequest) => string = (r) => `echo:${r.messages.at(-1)?.content ?? ""}`,
): Provider {
  const flagshipModel = `${name}-flagship`;
  return {
    name,
    flagshipModel,
    async complete(req) {
      const model = pickModel(req.model, flagshipModel);
      return result(
        name,
        { ...req, model },
        responder(req),
        { inputTokens: 0, outputTokens: 0 },
        "stop",
        0,
      );
    },
  };
}
