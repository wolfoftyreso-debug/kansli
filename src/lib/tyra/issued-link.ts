import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";
import { tyraHubPath } from "./tokens.ts";

export const TYRA_ISSUED_COOKIE = "tyra_issued";

export async function setIssuedHubLink(token: string): Promise<void> {
  if (!token) return;
  const jar = await cookies();
  jar.set(TYRA_ISSUED_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: 120,
  });
}

/** Read-only. Cookie writes are not allowed from a Server Component. */
export async function peekIssuedHubLink(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(TYRA_ISSUED_COOKIE)?.value?.trim() ?? "";
  return token ? tyraHubPath(token) : null;
}

export function publicTyraUrl(path: string): string {
  return path.startsWith("http") ? path : `${authConfig.baseUrl}${path}`;
}
