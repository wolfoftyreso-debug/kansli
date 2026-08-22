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

  const response = NextResponse.redirect(target);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export async function POST() {
  return endSession();
}

export async function GET() {
  return endSession();
}
