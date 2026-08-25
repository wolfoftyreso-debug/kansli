import { NextResponse, type NextRequest } from "next/server";
import { createOidcClient } from "@pixdrift/auth-client";
import { authConfig, SESSION_COOKIE } from "@/lib/auth/config";
import { authPublicUrlsFromRequest } from "@/lib/auth/origin";

async function endSession(request: NextRequest): Promise<NextResponse> {
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

  let target: string;
  try {
    target = await client.endSessionUrl({ postLogoutRedirectUri: `${urls.origin}/` });
  } catch {
    target = `${urls.origin}/`;
  }

  // 303 so the browser performs a GET on the IdP end-session endpoint (a POST
  // form submit would otherwise be re-issued as a POST by a 307).
  const response = NextResponse.redirect(target, 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function POST(request: NextRequest) {
  return endSession(request);
}

export async function GET(request: NextRequest) {
  return endSession(request);
}
