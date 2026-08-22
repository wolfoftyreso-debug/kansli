import type { ModelRequest, ModelResult, Provider } from "./types.ts";

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
 * Selection: an explicit `options.provider`, else a `provider:model` prefix on
 * the request model, else the failover order. When a provider is selected
 * explicitly or by prefix there is no failover (the caller asked for one).
 */
export function createModelRouter(options: RouterOptions): ModelRouter {
  const byName = new Map(options.providers.map((p) => [p.name, p]));
  const order = options.order ?? options.providers.map((p) => p.name);

  return {
    providers: [...byName.keys()],
    async complete(request, opts) {
      let chosen = opts?.provider;
      let model = request.model;
      const sep = request.model.indexOf(":");
      if (!chosen && sep > 0 && byName.has(request.model.slice(0, sep))) {
        chosen = request.model.slice(0, sep);
        model = request.model.slice(sep + 1);
      }

      const chain = chosen ? [chosen] : order;
      if (chain.length === 0) throw new Error("inga providers konfigurerade");

      const errors: string[] = [];
      for (const name of chain) {
        const provider = byName.get(name);
        if (!provider) {
          errors.push(`${name}: okänd provider`);
          continue;
        }
        try {
          return await provider.complete({ ...request, model });
        } catch (err) {
          errors.push(`${name}: ${(err as Error).message}`);
        }
      }
      throw new Error(`alla providers misslyckades: ${errors.join(" | ")}`);
    },
  };
}
