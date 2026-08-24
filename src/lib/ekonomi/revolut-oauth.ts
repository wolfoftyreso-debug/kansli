/**
 * Revolut Business API OAuth is not Pixdrift Identity.
 * Identity callback: /api/auth/callback
 * Revolut callback:  /ekonomi/anslutningar/revolut
 */

export const REVOLUT_OAUTH_PATH = "/ekonomi/anslutningar/revolut";

export type RevolutRedirectStatus = {
  uri: string;
  host: string;
  usableInRevolutPortal: boolean;
  reason: string;
};

function appOrigin(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  return (env.APP_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
}

export function revolutOAuthRedirectUri(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  const override = env.REVOLUT_REDIRECT_URI?.trim();
  if (override) {
    try {
      const url = new URL(override);
      if (url.pathname === "/" || url.pathname === "") {
        return `${url.origin}${REVOLUT_OAUTH_PATH}`;
      }
      return `${url.origin}${url.pathname}${url.search}`;
    } catch {
      throw new Error("REVOLUT_REDIRECT_URI måste vara en absolut URL.");
    }
  }
  return `${appOrigin(env)}${REVOLUT_OAUTH_PATH}`;
}

export function revolutJwtIss(redirectUri: string): string {
  return new URL(redirectUri).host;
}

export function revolutRedirectStatus(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): RevolutRedirectStatus {
  const uri = revolutOAuthRedirectUri(env);
  const parsed = new URL(uri);
  const host = parsed.host;
  const isLocal =
    parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
  const https = parsed.protocol === "https:";
  if (isLocal || !https) {
    return {
      uri,
      host,
      usableInRevolutPortal: false,
      reason:
        "Revoluts certifikatdialog kräver en publik https-URI. 127.0.0.1 och http avvisas. Sätt APP_BASE_URL eller REVOLUT_REDIRECT_URI till produktionens origin.",
    };
  }
  return {
    uri,
    host,
    usableInRevolutPortal: true,
    reason: `Klistra in URI:n i Revolut. JWT iss ska vara ${host}.`,
  };
}
