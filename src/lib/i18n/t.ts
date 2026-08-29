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

export function ekonomiInvoiceStatus(locale: Locale, status: string): string {
  const key = `ekonomi.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function ekonomiSmsStatus(locale: Locale, status: string): string {
  const key = `ekonomi.sms.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function ekonomiRailLabel(locale: Locale, id: string): string {
  const key = `ekonomi.rail.${id}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : id;
}

export function ekonomiPayStatus(locale: Locale, status: string): string {
  const key = `ekonomi.pay.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function ekonomiConnSlot(locale: Locale, provider: string): string {
  const key = `ekonomi.conn.slot.${provider}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : provider;
}

export function ekonomiRevolutStatus(locale: Locale, status: string): string {
  const key = `ekonomi.rev.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function ekonomiRevolutCert(locale: Locale, health: string): string {
  const key = `ekonomi.rev.cert.${health}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : health;
}

export function ekonomiRevolutKey(locale: Locale, state: string): string {
  const key = `ekonomi.rev.key.${state}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : state;
}

export function ekonomiRevolutError(locale: Locale, category: string): string {
  const key = `ekonomi.rev.err.${category}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : t(locale, "ekonomi.rev.err.unknown");
}

export function irmaStatus(locale: Locale, status: string): string {
  const key = `irma.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function irmaVerification(locale: Locale, level: number): string {
  const key = `irma.verify.${level}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : String(level);
}

export function toraCalKind(locale: Locale, kind: string): string {
  const key = `tora.cal.kind.${kind}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : kind;
}

export function toraReqStatus(locale: Locale, status: string): string {
  const key = `tora.req.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function toraTiming(locale: Locale, timing: string): string {
  const key = `tora.timing.${timing}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : timing;
}

export function toraEvalKind(locale: Locale, kind: string): string {
  const key = `tora.eval.${kind}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : kind;
}

export function ritaAnalysisStatus(locale: Locale, status: string): string {
  const key = `rita.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function ritaCategory(locale: Locale, category: string): string {
  const key = `rita.cat.${category.trim().toLowerCase()}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : category.trim() || t(locale, "rita.cat.other");
}

export function ritaFindingStatus(locale: Locale, status: string): string {
  const key = `rita.find.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function brittSource(locale: Locale, source: string): string {
  const key = `britt.source.${source}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : source.toUpperCase();
}

export function brittObsStatus(locale: Locale, status: string): string {
  const key = `britt.status.${status}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : status;
}

export function alvaOutcome(locale: Locale, value: string): string {
  if (value === "yes") return t(locale, "alva.yes");
  if (value === "no") return t(locale, "alva.no");
  return t(locale, "alva.unknown");
}

export function catalogField(
  locale: Locale,
  slug: string,
  field: "purpose" | "category" | "summary",
): string {
  const key = `site.catalog.${slug}.${field}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : slug;
}

export function catalogSection(
  locale: Locale,
  slug: string,
  no: string,
  fallback: string,
  vars?: MessageVars,
): string {
  const key = `site.catalog.${slug}.s${no}` as MessageKey;
  return key in catalogs.en ? t(locale, key, vars) : fallback;
}

export function catalogSteward(locale: Locale, stewardship: string): string {
  const key = `site.catalog.steward.${stewardship}` as MessageKey;
  return key in catalogs.en ? t(locale, key) : stewardship;
}
