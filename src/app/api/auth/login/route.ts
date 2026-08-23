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

export async function GET(request: NextRequest) {
  const client = createOidcClient({
    issuer: authConfig.issuer,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: authConfig.redirectUri,
  });

  const state = randomValue();
  const nonce = randomValue();
  const codeVerifier = generateCodeVerifier();
  const org = request.nextUrl.searchParams.get("org") ?? undefined;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  const authorizationUrl = await client.authorizationUrl({ state, nonce, codeVerifier, org });

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
