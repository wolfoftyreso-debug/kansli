import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  localeFromAcceptLanguage,
  parseLocale,
  type Locale,
} from "./locales.ts";

/** Cookie first, then Accept-Language, then English. */
export async function readLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = parseLocale(jar.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  const accept = (await headers()).get("accept-language");
  return localeFromAcceptLanguage(accept);
}

export function localeFromRequest(request: {
  cookies?: { get(name: string): { value: string } | undefined };
  headers?: Headers | { get(name: string): string | null };
}): Locale {
  const fromCookie = parseLocale(request.cookies?.get(LOCALE_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  const header =
    request.headers && "get" in request.headers ? request.headers.get("accept-language") : null;
  return localeFromAcceptLanguage(header) ?? DEFAULT_LOCALE;
}
