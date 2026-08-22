/**
 * Kansli acts as an OIDC client (BFF) of the Pixdrift identity provider.
 * Configuration comes from the environment with development-friendly defaults
 * so `pnpm dev` + `pnpm dev:idp` work out of the box.
 */
export const authConfig = {
  issuer: process.env.PIXDRIFT_ISSUER ?? "http://127.0.0.1:4000",
  clientId: process.env.PIXDRIFT_CLIENT_ID ?? "kansli-web",
  clientSecret: process.env.PIXDRIFT_CLIENT_SECRET ?? "kansli-dev-secret",
  redirectUri: process.env.PIXDRIFT_REDIRECT_URI ?? "http://127.0.0.1:3000/api/auth/callback",
  baseUrl: process.env.APP_BASE_URL ?? "http://127.0.0.1:3000",
  sessionSecret:
    process.env.APP_SESSION_SECRET ?? "kansli-dev-app-session-secret-byt-ut-i-drift-0001",
  cookieSecure: process.env.COOKIE_SECURE === "true",
} as const;

export const SESSION_COOKIE = "kansli_session";
export const STATE_COOKIE = "pd_state";
export const NONCE_COOKIE = "pd_nonce";
export const VERIFIER_COOKIE = "pd_verifier";
