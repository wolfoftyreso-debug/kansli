import type { ModelRequest, ModelResult, Provider } from "./types.ts";

/**
 * Canonical failover order for the Pixdrift family — **Claude first**, then the
 * other frontier providers fall down to one another. `createDefaultRouter`
 * (see env.ts) orders whatever providers are configured by this list.
 */
export const DEFAULT_FAILOVER_ORDER = ["anthropic", "openai", "gemini", "kimi", "gateway"] as const;

/** Model aliases that mean "use each provider's heaviest model". */
const FLAGSHIP_ALIASES = new Set(["", "auto", "flagship", "heaviest", "default", "tyngsta"]);

export interface RouterOptions {
  providers: Provider[];
  /** Failover order by provider name. Defaults to the order given. */
  order?: string[];
}

export interface CompleteOptions {
  /** Force a specific provider by name (overrides model prefix and order). */
  provider?: string;
}

export interface ModelRouter {
  readonly providers: string[];
  complete(request: ModelRequest, options?: CompleteOptions): Promise<ModelResult>;
}

/**
 * Routes a request to a provider and fails over through `order` on error.
 *
 * Selection:
 * - an explicit `options.provider`, else
 * - a `provider:model` prefix on the request model, else
 * - the failover order (Claude first by default).
 *
 * Model resolution: when the request names no model (or uses an alias like
 * "auto"/"flagship"), each provider uses its own `flagshipModel` — so
 * cross-provider failover always lands on that provider's heaviest model
 * rather than a foreign id. When a provider is selected explicitly or by prefix
 * there is no failover (the caller asked for one).
 */
export function createModelRouter(options: RouterOptions): ModelRouter {
  const byName = new Map(options.providers.map((p) => [p.name, p]));
  const order = options.order ?? options.providers.map((p) => p.name);

  return {
    providers: [...byName.keys()],
    async complete(request, opts) {
      const raw = request.model ?? "";
      let chosen = opts?.provider;
      let explicitModel: string | undefined;

      const sep = raw.indexOf(":");
      if (!chosen && sep > 0 && byName.has(raw.slice(0, sep))) {
        chosen = raw.slice(0, sep);
        explicitModel = raw.slice(sep + 1);
      } else if (chosen && raw && !FLAGSHIP_ALIASES.has(raw.toLowerCase())) {
        // Forced provider with a concrete (non-alias) model id: honour it.
        explicitModel = raw;
      }

      const chain = chosen ? [chosen] : order;
      if (chain.length === 0) throw new Error("No providers are configured.");

      // Without an explicit model, treat a plain alias (or empty) as "flagship".
      const wantsFlagship = explicitModel === undefined && FLAGSHIP_ALIASES.has(raw.toLowerCase());

      const errors: string[] = [];
      for (const name of chain) {
        const provider = byName.get(name);
        if (!provider) {
          errors.push(`${name}: unknown provider`);
          continue;
        }
        // Per-provider heaviest model on flagship/failover; else the caller's id.
        const model =
          explicitModel ?? (wantsFlagship ? (provider.flagshipModel ?? raw) : raw || undefined);
        try {
          return await provider.complete({ ...request, model });
        } catch (err) {
          errors.push(`${name}: ${(err as Error).message}`);
        }
      }
      throw new Error(`All providers failed: ${errors.join(" | ")}`);
    },
  };
}
