import { FAMILY_SYSTEMS } from "../platform/family.ts";
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
  return familyField(locale, id, "mission");
}

export function familyField(
  locale: Locale,
  id: string,
  field: "mission" | "question" | "does" | "doesNot",
): string {
  const key = `family.${id}.${field}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function familyStatusLabel(
  locale: Locale,
  status: "operational" | "pilot" | "deferred",
): string {
  return t(locale, `family.status.${status}`);
}

export function familyStackLine(locale: Locale, id: string, part: "layer" | "runs"): string {
  const key = (part === "runs" ? `family.stack.${id}.runs` : `family.stack.${id}`) as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function familyLinkMeaning(locale: Locale, id: string): string {
  const key = `family.link.${id}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function familyBlockedNeed(locale: Locale, id: string): string {
  const key = `family.blocked.${id}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function familyPartyLabel(locale: Locale, id: string): string {
  if (id === "products" || id === "alla produkter") return t(locale, "family.party.products");
  if (id === "platform.events") return t(locale, "family.party.events");
  return FAMILY_SYSTEMS.find((system) => system.id === id)?.name ?? id;
}

export function opsSmsKindLabel(locale: Locale, kind: string): string {
  const key = `ops.sms.kind.${kind}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : kind;
}

export function opsQueueStatus(locale: Locale, status: string): string {
  const key = `ops.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function opsNoticeLevel(locale: Locale, level: string): string {
  const key = `ops.level.${level}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : level;
}

export function tyraIntentLabel(locale: Locale, intent: string): string {
  const key = `tyra.intent.${intent}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : intent;
}

export function tyraCaseStatus(locale: Locale, status: string): string {
  const key = `tyra.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function tyraStepStatus(locale: Locale, status: string): string {
  const key = `tyra.step.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}
