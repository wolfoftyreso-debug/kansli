import { NextResponse, type NextRequest } from "next/server";
import { createOidcClient } from "@pixdrift/auth-client";
import {
  authConfig,
  NEXT_COOKIE,
  NONCE_COOKIE,
  SESSION_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
} from "@/lib/auth/config";
import { safeNextPath } from "@/lib/auth/next";
import { sealSession } from "@/lib/auth/session";

function fail(reason: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/?error=${encodeURIComponent(reason)}`, authConfig.baseUrl),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oidcError = request.nextUrl.searchParams.get("error");
  if (oidcError) return fail(oidcError);

  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return fail("state");
  }

  const client = createOidcClient({
    issuer: authConfig.issuer,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: authConfig.redirectUri,
  });

  let sessionValue: string;
  try {
    const tokens = await client.exchangeCode({ code, codeVerifier: verifier, nonce: nonce ?? "" });
    sessionValue = await sealSession({
      sub: tokens.claims.sub,
      email: tokens.claims.email,
      name: tokens.claims.name,
      org: tokens.claims.org,
      memberships: tokens.claims.memberships,
    });
  } catch {
    return fail("exchange");
  }

  const next = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value) ?? "/kansli";
  const response = NextResponse.redirect(new URL(next, authConfig.baseUrl));
  response.cookies.set(SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  response.cookies.delete(STATE_COOKIE);
  response.cookies.delete(NONCE_COOKIE);
  response.cookies.delete(VERIFIER_COOKIE);
  response.cookies.delete(NEXT_COOKIE);
  return response;
}
