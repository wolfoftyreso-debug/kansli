/**
 * Doctrine §14 — English is canonical. Every other locale is a translation.
 * Polish is in the shipped set (operator request) together with the brand list.
 */

export const UI_LOCALES = [
  "en",
  "sv",
  "pl",
  "de",
  "es",
  "fr",
  "nl",
  "it",
  "no",
  "da",
  "fi",
] as const;

export type Locale = (typeof UI_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE = "pd_locale";

/** Language names stay in their own language. Not a product — chrome only. */
export const LOCALE_NATIVE_NAME: Record<Locale, string> = {
  en: "English",
  sv: "Svenska",
  pl: "Polski",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  nl: "Nederlands",
  it: "Italiano",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
};

const ALIASES: Record<string, Locale> = {
  nb: "no",
  nn: "no",
  "nb-no": "no",
  "nn-no": "no",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (UI_LOCALES as readonly string[]).includes(value);
}

export function parseLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const raw = value.trim().toLowerCase();
  if (isLocale(raw)) return raw;
  const aliased = ALIASES[raw];
  if (aliased) return aliased;
  const base = raw.split("-")[0] ?? "";
  if (isLocale(base)) return base;
  return ALIASES[base] ?? null;
}

/** First supported tag in an Accept-Language header. Silent English if none. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number(q.trim().slice(2)) : 1;
      return { tag: tag?.trim() ?? "", quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.tag)
    .sort((a, b) => b.quality - a.quality);
  for (const item of tags) {
    const match = parseLocale(item.tag);
    if (match) return match;
  }
  return DEFAULT_LOCALE;
}

export function localeTag(locale: Locale): string {
  if (locale === "no") return "nb-NO";
  return locale;
}
