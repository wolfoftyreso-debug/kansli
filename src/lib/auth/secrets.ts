/**
 * BFF secrets. Dev defaults exist so `pnpm dev` works.
 * APP_ENV=prod|production must set real secrets — no silent fallback.
 */
export type AuthEnv = Record<string, string | undefined>;

export function isHardenedRuntime(env: AuthEnv = process.env): boolean {
  return env.APP_ENV === "prod" || env.APP_ENV === "production";
}

export function resolveSessionSecret(env: AuthEnv = process.env): string {
  const configured = env.APP_SESSION_SECRET?.trim();
  if (isHardenedRuntime(env)) {
    if (!configured) {
      throw new Error("APP_SESSION_SECRET must be set when APP_ENV=prod");
    }
    return configured;
  }
  return configured || "kansli-dev-app-session-secret-byt-ut-i-drift-0001";
}

export function resolveClientSecret(env: AuthEnv = process.env): string {
  const configured = (env.PIXDRIFT_CLIENT_SECRET ?? env.CLIENT_SECRET)?.trim();
  if (isHardenedRuntime(env)) {
    if (!configured) {
      throw new Error("PIXDRIFT_CLIENT_SECRET must be set when APP_ENV=prod");
    }
    return configured;
  }
  return configured || "kansli-dev-secret";
}
