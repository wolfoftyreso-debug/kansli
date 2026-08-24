/**
 * Environment handed to `skattjakt-analyze`.
 *
 * The binary reads Anthropic + SKATTJAKT_* from its own process. Passing the
 * whole parent env would also hand it DATABASE_URL. Only this allowlist.
 */

export const SUBPROCESS_ENV_ALLOWLIST = [
  "PATH",
  "HOME",
  "LANG",
  "LC_ALL",
  "TZ",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_MODEL",
  "SKATTJAKT_MODEL_ID",
  "SKATTJAKT_MODEL_TIMEOUT_SECS",
  "SKATTJAKT_MODEL_MAX_RETRIES",
  "SKATTJAKT_MODEL_FALLBACK",
  "SKATTJAKT_MODEL_PRICES",
  "SKATTJAKT_ANALYSIS_BUDGET_SEK",
] as const;

/** Conservative ceiling so an unpriced model cannot be called (engine refuses). */
export const DEFAULT_MODEL_PRICE = {
  input_per_mtok: 3_000_000_000,
  output_per_mtok: 15_000_000_000,
} as const;

export const DEFAULT_SKATTJAKT_MODEL_ID = "claude-fable-5";

export function subprocessEngineEnv(
  source: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
  defaults?: { modelId?: string },
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { NODE_ENV: "production" };
  for (const key of SUBPROCESS_ENV_ALLOWLIST) {
    const value = source[key]?.trim();
    if (value) env[key] = value;
  }
  if (!env.PATH) env.PATH = source.PATH || "/usr/bin:/bin";

  const apiKey = env.ANTHROPIC_API_KEY;
  if (apiKey) {
    const modelId =
      env.SKATTJAKT_MODEL_ID ||
      env.ANTHROPIC_MODEL ||
      defaults?.modelId?.trim() ||
      DEFAULT_SKATTJAKT_MODEL_ID;
    env.SKATTJAKT_MODEL_ID = modelId;
    if (!env.SKATTJAKT_MODEL_PRICES) {
      env.SKATTJAKT_MODEL_PRICES = JSON.stringify({ [modelId]: DEFAULT_MODEL_PRICE });
    }
    if (!env.SKATTJAKT_MODEL_FALLBACK) env.SKATTJAKT_MODEL_FALLBACK = "false";
  }

  return env;
}

export function ritaModelReady(
  source: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return Boolean(source.ANTHROPIC_API_KEY?.trim());
}
