import { NextResponse, type NextRequest } from "next/server";
import { createOidcClient, generateCodeVerifier, randomValue } from "@pixdrift/auth-client";
import {
  authConfig,
  NEXT_COOKIE,
  NONCE_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
} from "@/lib/auth/config";
import { safeNextPath } from "@/lib/auth/next";
import { authPublicUrlsFromRequest } from "@/lib/auth/origin";
import { localeTag, t } from "@/lib/i18n";
import { localeFromRequest } from "@/lib/i18n/request";
import { appRoomRobotsMeta } from "@/lib/platform/app-robots";

export async function GET(request: NextRequest) {
  const urls = authPublicUrlsFromRequest({
    proto: request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol,
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });
  const client = createOidcClient({
    issuer: urls.issuer,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: urls.redirectUri,
  });

  const state = randomValue();
  const nonce = randomValue();
  const codeVerifier = generateCodeVerifier();
  const org = request.nextUrl.searchParams.get("org") ?? undefined;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  let authorizationUrl: string;
  try {
    authorizationUrl = await client.authorizationUrl({ state, nonce, codeVerifier, org });
  } catch (err) {
    console.error("[auth/login] authorization url failed", err);
    const locale = localeFromRequest(request);
    const home = t(locale, "idp.home");
    return new NextResponse(
      `<!doctype html><html lang="${localeTag(locale)}"><meta charset="utf-8">${appRoomRobotsMeta()}<title>${t(locale, "idp.loginUnavailable")}</title><body style="font-family:system-ui;max-width:36rem;margin:3rem auto;padding:0 1rem"><h1>${t(locale, "idp.loginUnavailable")}</h1><p>${t(locale, "idp.loginUnavailableBody", { home: `<a href="/">${home}</a>` })}</p></body></html>`,
      { status: 503, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }

  const response = NextResponse.redirect(authorizationUrl);
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: 600,
  };
  response.cookies.set(STATE_COOKIE, state, opts);
  response.cookies.set(NONCE_COOKIE, nonce, opts);
  response.cookies.set(VERIFIER_COOKIE, codeVerifier, opts);
  if (next) response.cookies.set(NEXT_COOKIE, next, opts);
  else response.cookies.delete(NEXT_COOKIE);
  return response;
}
