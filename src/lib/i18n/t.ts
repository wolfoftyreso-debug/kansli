import { DA } from "./da.ts";
import { DE } from "./de.ts";
import { EN, type MessageKey } from "./en.ts";
import { ES } from "./es.ts";
import { FI } from "./fi.ts";
import { FR } from "./fr.ts";
import { IT } from "./it.ts";
import { DEFAULT_LOCALE, type Locale } from "./locales.ts";
import { NL } from "./nl.ts";
import { NO } from "./no.ts";
import { PL } from "./pl.ts";
import { SV } from "./sv.ts";

export type { MessageKey };

export const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en: EN,
  sv: SV,
  pl: PL,
  de: DE,
  es: ES,
  fr: FR,
  nl: NL,
  it: IT,
  no: NO,
  da: DA,
  fi: FI,
};

export type MessageVars = Record<string, string | number>;

/** Silent English fallback. Missing keys never throw in the UI. */
export function t(locale: Locale, key: MessageKey, vars?: MessageVars): string {
  const raw = catalogs[locale][key] || catalogs[DEFAULT_LOCALE][key] || key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : match,
  );
}

export function messageKeys(): MessageKey[] {
  return Object.keys(EN) as MessageKey[];
}

export function familyMission(locale: Locale, id: string): string {
  const key = `family.${id}.mission` as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function familyStatusLabel(
  locale: Locale,
  status: "operational" | "pilot" | "deferred",
): string {
  return t(locale, `family.status.${status}`);
}
