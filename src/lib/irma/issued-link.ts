import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";
import { issuedPathFromCookie, tokenFromIssuedPath } from "./issued-path.ts";

export const IRMA_ISSUED_COOKIE = "irma_issued";
export { issuedPathFromCookie, tokenFromIssuedPath };

export async function setIssuedLink(path: string): Promise<void> {
  const token = tokenFromIssuedPath(path);
  if (!token) return;
  const jar = await cookies();
  jar.set(IRMA_ISSUED_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/",
    maxAge: 600,
  });
}

/** Read-only. Cookie writes are not allowed from the /irma Server Component. */
export async function peekIssuedLink(): Promise<string | null> {
  const jar = await cookies();
  return issuedPathFromCookie(jar.get(IRMA_ISSUED_COOKIE)?.value ?? "");
}

export function publicIrmaUrl(path: string): string {
  return path.startsWith("http") ? path : `${authConfig.baseUrl}${path}`;
}
