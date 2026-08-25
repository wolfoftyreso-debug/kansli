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
import { authPublicUrlsFromRequest } from "@/lib/auth/origin";
import { sealSession } from "@/lib/auth/session";
import { getRuntime } from "@/lib/platform/runtime";

function urlsFor(request: NextRequest) {
  return authPublicUrlsFromRequest({
    proto: request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol,
    host: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });
}

function fail(request: NextRequest, reason: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/?error=${encodeURIComponent(reason)}`, urlsFor(request).origin),
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const oidcError = request.nextUrl.searchParams.get("error");
  if (oidcError) return fail(request, oidcError);

  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const verifier = request.cookies.get(VERIFIER_COOKIE)?.value;
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return fail(request, "state");
  }

  const urls = urlsFor(request);
  const client = createOidcClient({
    issuer: urls.issuer,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: urls.redirectUri,
  });

  let sessionValue: string;
  let claims: { sub: string; email: string; orgRef: string | null };
  try {
    const tokens = await client.exchangeCode({ code, codeVerifier: verifier, nonce: nonce ?? "" });
    claims = {
      sub: tokens.claims.sub,
      email: tokens.claims.email,
      orgRef: tokens.claims.org?.ref ?? null,
    };
    sessionValue = await sealSession({
      sub: tokens.claims.sub,
      email: tokens.claims.email,
      name: tokens.claims.name,
      org: tokens.claims.org,
      memberships: tokens.claims.memberships,
    });
  } catch {
    return fail(request, "exchange");
  }

  try {
    await getRuntime().events.publish({
      system: "identity",
      kind: "identity.session.started",
      orgRef: claims.orgRef,
      actorKind: "user",
      actorRef: claims.sub,
      subjectRef: claims.sub,
      payload: { email: claims.email },
    });
  } catch {
    // Login must succeed even if the event log is down.
  }

  const next = safeNextPath(request.cookies.get(NEXT_COOKIE)?.value) ?? "/kansli";
  const response = NextResponse.redirect(new URL(next, urls.origin));
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
