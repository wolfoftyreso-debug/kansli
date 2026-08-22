import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { IdTokenClaims } from "@pixdrift/contracts";
import { authConfig, SESSION_COOKIE } from "./config";

/**
 * The app session. Kansli keeps its own signed cookie (a BFF) rather than
 * handing tokens to the browser — the identity provider proves who the user is,
 * the app decides how long its own session lives.
 */
export interface AppSession {
  sub: string;
  email: string;
  name: string;
  org: IdTokenClaims["org"];
  memberships: IdTokenClaims["memberships"];
}

const secretKey = new TextEncoder().encode(authConfig.sessionSecret);

export async function sealSession(session: AppSession): Promise<string> {
  return new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

export async function readSession(): Promise<AppSession | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, secretKey);
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      org: (payload.org ?? null) as AppSession["org"],
      memberships: (payload.memberships ?? []) as AppSession["memberships"],
    };
  } catch {
    return null;
  }
}
