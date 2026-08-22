import {
  anthropicProvider,
  geminiProvider,
  moonshotProvider,
  openAICompatibleProvider,
  FLAGSHIP_MODELS,
} from "./providers.ts";
import { createModelRouter, DEFAULT_FAILOVER_ORDER, type ModelRouter } from "./router.ts";
import type { Provider } from "./types.ts";

export interface EnvProviderOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

/**
 * Builds the providers that have a configured key, from the canonical secret
 * names (see docs/AI-PROVIDERS.md). Providers are returned **Claude first**.
 *
 * Each provider runs its heaviest model by default (see FLAGSHIP_MODELS),
 * overridable per provider via env: `ANTHROPIC_MODEL`, `OPENAI_MODEL`,
 * `GEMINI_MODEL`, `MOONSHOT_MODEL` (alias `KIMI_MODEL`), `AI_GATEWAY_MODEL`.
 *
 * A single `AI_GATEWAY_API_KEY` adds an OpenAI-compatible "gateway" provider
 * that fronts all models.
 */
export function providersFromEnv(options: EnvProviderOptions = {}): Provider[] {
  const env = options.env ?? (process.env as Record<string, string | undefined>);
  const fetchImpl = options.fetchImpl;
  const providers: Provider[] = [];

  if (env.ANTHROPIC_API_KEY) {
    providers.push(
      anthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL, fetchImpl }),
    );
  }
  if (env.OPENAI_API_KEY) {
    providers.push(
      openAICompatibleProvider({
        apiKey: env.OPENAI_API_KEY,
        name: "openai",
        model: env.OPENAI_MODEL,
        fetchImpl,
      }),
    );
  }
  if (env.GEMINI_API_KEY) {
    providers.push(
      geminiProvider({ apiKey: env.GEMINI_API_KEY, model: env.GEMINI_MODEL, fetchImpl }),
    );
  }
  if (env.MOONSHOT_API_KEY) {
    providers.push(
      moonshotProvider({
        apiKey: env.MOONSHOT_API_KEY,
        baseUrl: env.MOONSHOT_BASE_URL,
        model: env.MOONSHOT_MODEL ?? env.KIMI_MODEL,
        fetchImpl,
      }),
    );
  }
  if (env.AI_GATEWAY_API_KEY) {
    providers.push(
      openAICompatibleProvider({
        apiKey: env.AI_GATEWAY_API_KEY,
        baseUrl: env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1",
        name: "gateway",
        model: env.AI_GATEWAY_MODEL ?? FLAGSHIP_MODELS.gateway,
        fetchImpl,
      }),
    );
  }
  return providers;
}

/**
 * The batteries-included entry point: build every configured provider on its
 * heaviest model and wire them into a **Claude-first** failover chain
 * (DEFAULT_FAILOVER_ORDER). Call `complete` without a model (or with "auto")
 * to run the flagship of each provider as it falls down the chain.
 *
 *   const ai = createDefaultRouter();
 *   const answer = await ai.complete({ messages: [{ role: "user", content: "…" }] });
 */
export function createDefaultRouter(options: EnvProviderOptions = {}): ModelRouter {
  const providers = providersFromEnv(options);
  const rank = (name: string) => {
    const i = DEFAULT_FAILOVER_ORDER.indexOf(name as (typeof DEFAULT_FAILOVER_ORDER)[number]);
    return i === -1 ? DEFAULT_FAILOVER_ORDER.length : i;
  };
  const order = providers.map((p) => p.name).sort((a, b) => rank(a) - rank(b));
  return createModelRouter({ providers, order });
}
