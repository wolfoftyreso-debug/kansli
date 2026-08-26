import { authPublicUrls } from "./origin.ts";
import { isHardenedRuntime, resolveClientSecret, resolveSessionSecret } from "./secrets.ts";

const urls = authPublicUrls();

/**
 * Kansli acts as an OIDC client (BFF) of the Pixdrift identity provider.
 * Local defaults keep `pnpm dev` working. On a Vercel preview the URLs follow
 * this deployment — not production — so login does not call localhost.
 */
export const authConfig = {
  issuer: urls.issuer,
  clientId: process.env.PIXDRIFT_CLIENT_ID ?? "kansli-web",
  clientSecret: resolveClientSecret(),
  redirectUri: urls.redirectUri,
  baseUrl: urls.origin,
  sessionSecret: resolveSessionSecret(),
  cookieSecure: isHardenedRuntime()
    ? true
    : process.env.COOKIE_SECURE !== undefined
      ? process.env.COOKIE_SECURE === "true"
      : urls.origin.startsWith("https://"),
} as const;

export const SESSION_COOKIE = "kansli_session";
export const STATE_COOKIE = "pd_state";
export const NONCE_COOKIE = "pd_nonce";
export const VERIFIER_COOKIE = "pd_verifier";
export const NEXT_COOKIE = "pd_next";
