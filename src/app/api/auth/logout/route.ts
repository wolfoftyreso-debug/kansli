import { NextResponse } from "next/server";
import { createOidcClient } from "@pixdrift/auth-client";
import { authConfig, SESSION_COOKIE } from "@/lib/auth/config";

async function endSession(): Promise<NextResponse> {
  const client = createOidcClient({
    issuer: authConfig.issuer,
    clientId: authConfig.clientId,
    clientSecret: authConfig.clientSecret,
    redirectUri: authConfig.redirectUri,
  });

  let target: string;
  try {
    target = await client.endSessionUrl({ postLogoutRedirectUri: `${authConfig.baseUrl}/` });
  } catch {
    target = `${authConfig.baseUrl}/`;
  }

  // 303 so the browser performs a GET on the IdP end-session endpoint (a POST
  // form submit would otherwise be re-issued as a POST by a 307).
  const response = NextResponse.redirect(target, 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function POST() {
  return endSession();
}

export async function GET() {
  return endSession();
}
