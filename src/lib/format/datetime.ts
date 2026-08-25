const STOCKHOLM = "Europe/Stockholm";

function asDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 3 sep 2026 10:00 — workshop clocks, not ISO dumps. */
export function formatSwedishDateTime(value: string | Date): string {
  const date = asDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: STOCKHOLM,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
