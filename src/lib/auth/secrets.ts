/**
 * BFF secrets. Dev defaults exist so `pnpm dev` works.
 * Hardened runtime (APP_ENV=prod|production or VERCEL_ENV=production,
 * never preview) must set real secrets — no silent fallback.
 */
export type AuthEnv = Record<string, string | undefined>;

const DEV_SESSION_FALLBACK = "kansli-dev-app-session-secret-byt-ut-i-drift-0001";
const DEV_CLIENT_FALLBACK = "kansli-dev-secret";
export const MIN_HARDENED_SECRET_LENGTH = 32;

/** Vercel preview builds set NODE_ENV=production. That is not production. */
export function isHardenedRuntime(env: AuthEnv = process.env): boolean {
  if (env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") return false;
  return env.APP_ENV === "prod" || env.APP_ENV === "production" || env.VERCEL_ENV === "production";
}

function rejectWeakSecret(name: string, value: string, knownDev: string[]): void {
  if (value.length < MIN_HARDENED_SECRET_LENGTH) {
    throw new Error(
      `${name} must be at least ${MIN_HARDENED_SECRET_LENGTH} characters when the runtime is hardened`,
    );
  }
  if (knownDev.includes(value) || value.startsWith("kansli-dev")) {
    throw new Error(`${name} must not be a development fallback when the runtime is hardened`);
  }
}

export function resolveSessionSecret(env: AuthEnv = process.env): string {
  const configured = env.APP_SESSION_SECRET?.trim();
  if (isHardenedRuntime(env)) {
    if (!configured) {
      throw new Error("APP_SESSION_SECRET must be set when the runtime is hardened");
    }
    rejectWeakSecret("APP_SESSION_SECRET", configured, [DEV_SESSION_FALLBACK]);
    return configured;
  }
  return configured || DEV_SESSION_FALLBACK;
}

export function resolveClientSecret(env: AuthEnv = process.env): string {
  const configured = (env.PIXDRIFT_CLIENT_SECRET ?? env.CLIENT_SECRET)?.trim();
  if (isHardenedRuntime(env)) {
    if (!configured) {
      throw new Error("PIXDRIFT_CLIENT_SECRET must be set when the runtime is hardened");
    }
    rejectWeakSecret("PIXDRIFT_CLIENT_SECRET", configured, [DEV_CLIENT_FALLBACK]);
    return configured;
  }
  return configured || DEV_CLIENT_FALLBACK;
}

/** Fail closed at Node boot. Preview and `pnpm dev` are unchanged. */
export function assertHardenedBoot(env: AuthEnv = process.env): void {
  if (!isHardenedRuntime(env)) return;
  if (!env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL must be set when the runtime is hardened");
  }
  if (env.PIXDRIFT_SEED_DEMO === "true") {
    throw new Error("PIXDRIFT_SEED_DEMO=true is forbidden when the runtime is hardened");
  }
  if (env.COOKIE_SECURE === "false") {
    throw new Error("COOKIE_SECURE=false is forbidden when the runtime is hardened");
  }
  resolveSessionSecret(env);
  resolveClientSecret(env);
}
