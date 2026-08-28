import { DEFAULT_LOCALE, localeTag, type Locale } from "../i18n/locales.ts";

const STOCKHOLM = "Europe/Stockholm";

function asDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Workshop clocks, not ISO dumps. Locale follows the chrome. */
export function formatDateTime(value: string | Date, locale: Locale = DEFAULT_LOCALE): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: STOCKHOLM,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** 3 sep 2026 10:00 — Swedish wall time. */
export function formatSwedishDateTime(value: string | Date): string {
  return formatDateTime(value, "sv");
}

/** 3 Sep 2026 — Swedish wall time, chrome locale. */
export function formatDate(value: string | Date, locale: Locale = DEFAULT_LOCALE): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: STOCKHOLM,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** 3 september 2026 */
export function formatSwedishDate(value: string | Date): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatSwedishDateShort(value: string | Date): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
