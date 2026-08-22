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
    model: req.model,
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
  fetchImpl?: FetchImpl;
}

export function anthropicProvider(opts: AnthropicOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://api.anthropic.com";
  return {
    name: "anthropic",
    async complete(req) {
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
            model: req.model,
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
        req,
        text,
        { inputTokens: json.usage?.input_tokens ?? null, outputTokens: json.usage?.output_tokens ?? null },
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
  fetchImpl?: FetchImpl;
}

export function openAICompatibleProvider(opts: OpenAICompatibleOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://api.openai.com/v1";
  const name = opts.name ?? "openai";
  return {
    name,
    async complete(req) {
      const { value: res, ms } = await timed(() =>
        doFetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${opts.apiKey}` },
          body: JSON.stringify({
            model: req.model,
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
        req,
        choice?.message?.content ?? "",
        { inputTokens: json.usage?.prompt_tokens ?? null, outputTokens: json.usage?.completion_tokens ?? null },
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
  fetchImpl?: FetchImpl;
}

/** Kimi via Moonshot's OpenAI-compatible API. Provider name is "kimi". */
export function moonshotProvider(opts: MoonshotOptions): Provider {
  return openAICompatibleProvider({
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl ?? "https://api.moonshot.ai/v1",
    name: "kimi",
    fetchImpl: opts.fetchImpl,
  });
}

// --- Google Gemini -----------------------------------------------------------
export interface GeminiOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchImpl;
}

export function geminiProvider(opts: GeminiOptions): Provider {
  const doFetch = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? "https://generativelanguage.googleapis.com/v1beta";
  return {
    name: "gemini",
    async complete(req) {
      const { system, rest } = splitSystem(req.messages);
      const url = `${baseUrl}/models/${encodeURIComponent(req.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;
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
        req,
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
  return {
    name,
    async complete(req) {
      return result(name, req, responder(req), { inputTokens: 0, outputTokens: 0 }, "stop", 0);
    },
  };
}
