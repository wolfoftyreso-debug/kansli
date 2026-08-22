import {
  anthropicProvider,
  geminiProvider,
  moonshotProvider,
  openAICompatibleProvider,
} from "./providers.ts";
import type { Provider } from "./types.ts";

export interface EnvProviderOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}

/**
 * Builds the providers that have a configured key, from the canonical secret
 * names (see docs/AI-PROVIDERS.md). A single `AI_GATEWAY_API_KEY` adds an
 * OpenAI-compatible "gateway" provider that fronts all models.
 */
export function providersFromEnv(options: EnvProviderOptions = {}): Provider[] {
  const env = options.env ?? (process.env as Record<string, string | undefined>);
  const fetchImpl = options.fetchImpl;
  const providers: Provider[] = [];

  if (env.ANTHROPIC_API_KEY) {
    providers.push(anthropicProvider({ apiKey: env.ANTHROPIC_API_KEY, fetchImpl }));
  }
  if (env.OPENAI_API_KEY) {
    providers.push(openAICompatibleProvider({ apiKey: env.OPENAI_API_KEY, name: "openai", fetchImpl }));
  }
  if (env.GEMINI_API_KEY) {
    providers.push(geminiProvider({ apiKey: env.GEMINI_API_KEY, fetchImpl }));
  }
  if (env.MOONSHOT_API_KEY) {
    providers.push(
      moonshotProvider({ apiKey: env.MOONSHOT_API_KEY, baseUrl: env.MOONSHOT_BASE_URL, fetchImpl }),
    );
  }
  if (env.AI_GATEWAY_API_KEY) {
    providers.push(
      openAICompatibleProvider({
        apiKey: env.AI_GATEWAY_API_KEY,
        baseUrl: env.AI_GATEWAY_BASE_URL ?? "https://ai-gateway.vercel.sh/v1",
        name: "gateway",
        fetchImpl,
      }),
    );
  }
  return providers;
}
