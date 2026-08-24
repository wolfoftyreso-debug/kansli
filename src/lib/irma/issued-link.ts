import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth/config";

export const IRMA_ISSUED_COOKIE = "irma_issued";

export async function setIssuedLink(path: string): Promise<void> {
  const jar = await cookies();
  jar.set(IRMA_ISSUED_COOKIE, path, {
    httpOnly: true,
    sameSite: "lax",
    secure: authConfig.cookieSecure,
    path: "/irma",
    maxAge: 120,
  });
}

/** Read-only. Deleting cookies from a Server Component throws in Next.js. The cookie expires in 120s. */
export async function peekIssuedLink(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(IRMA_ISSUED_COOKIE)?.value?.trim() ?? "";
  if (!value.startsWith("/irma/l/")) return null;
  return value;
}

export function publicIrmaUrl(path: string): string {
  return path.startsWith("http") ? path : `${authConfig.baseUrl}${path}`;
}
