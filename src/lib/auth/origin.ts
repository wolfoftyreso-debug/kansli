export type OriginEnv = Record<string, string | undefined>;

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function hostOf(url: string): string | null {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).host;
  } catch {
    return null;
  }
}

export function vercelHost(env: OriginEnv = process.env): string | null {
  const raw = env.VERCEL_URL?.trim();
  if (!raw) return null;
  return hostOf(raw);
}

/** Preview must stay on its own host. Production APP_BASE_URL would send login to the wrong place. */
export function publicOrigin(env: OriginEnv = process.env): string {
  const vercel = vercelHost(env);
  if ((env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development") && vercel) {
    return `https://${vercel}`;
  }
  const configured = env.APP_BASE_URL?.trim();
  if (configured) return trimSlash(configured);
  if (vercel) return `https://${vercel}`;
  return "http://127.0.0.1:3000";
}

export function authPublicUrls(env: OriginEnv = process.env): {
  origin: string;
  issuer: string;
  redirectUri: string;
} {
  const origin = publicOrigin(env);
  const preview = env.VERCEL_ENV === "preview" || env.VERCEL_ENV === "development";
  const configuredIssuer = env.PIXDRIFT_ISSUER?.trim();
  const configuredRedirect = env.PIXDRIFT_REDIRECT_URI?.trim();
  return {
    origin,
    issuer: preview || !configuredIssuer ? `${origin}/idp` : trimSlash(configuredIssuer),
    redirectUri:
      preview || !configuredRedirect ? `${origin}/api/auth/callback` : configuredRedirect,
  };
}
