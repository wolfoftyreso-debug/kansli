import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";

function safeLocaleNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("://") || value.includes("\\") || value.includes("@")) return "/";
  const path = value.split("?")[0]?.split("#")[0];
  return path || "/";
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const locale = parseLocale(String(form.get("locale") ?? ""));
  const next = safeLocaleNext(String(form.get("next") ?? "/"));
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  if (locale) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      httpOnly: true,
      sameSite: "lax",
      secure: authConfig.cookieSecure,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}
