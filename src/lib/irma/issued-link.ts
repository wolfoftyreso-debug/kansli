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

export async function takeIssuedLink(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(IRMA_ISSUED_COOKIE)?.value?.trim() ?? "";
  if (!value.startsWith("/irma/l/")) return null;
  jar.delete({ name: IRMA_ISSUED_COOKIE, path: "/irma" });
  return value;
}

export function publicIrmaUrl(path: string): string {
  return path.startsWith("http") ? path : `${authConfig.baseUrl}${path}`;
}
