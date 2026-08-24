import { resolveClientSecret, resolveSessionSecret } from "./secrets.ts";

/**
 * Kansli acts as an OIDC client (BFF) of the Pixdrift identity provider.
 * Configuration comes from the environment with development-friendly defaults
 * so `pnpm dev` + `pnpm dev:idp` work out of the box. APP_ENV=prod fails closed.
 */
export const authConfig = {
  // The IdP is co-located under /idp in this app; default to same-origin so
  // `pnpm dev` gives a working SSO flow with no extra process. Override with
  // PIXDRIFT_ISSUER (e.g. https://<host>/idp in production).
  issuer: process.env.PIXDRIFT_ISSUER ?? "http://127.0.0.1:3000/idp",
  clientId: process.env.PIXDRIFT_CLIENT_ID ?? "kansli-web",
  clientSecret: resolveClientSecret(),
  redirectUri: process.env.PIXDRIFT_REDIRECT_URI ?? "http://127.0.0.1:3000/api/auth/callback",
  baseUrl: process.env.APP_BASE_URL ?? "http://127.0.0.1:3000",
  sessionSecret: resolveSessionSecret(),
  cookieSecure: process.env.COOKIE_SECURE === "true",
} as const;

export const SESSION_COOKIE = "kansli_session";
export const STATE_COOKIE = "pd_state";
export const NONCE_COOKIE = "pd_nonce";
export const VERIFIER_COOKIE = "pd_verifier";
export const NEXT_COOKIE = "pd_next";
