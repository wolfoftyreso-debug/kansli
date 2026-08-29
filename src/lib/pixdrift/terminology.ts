/**
 * Controlled terminology registry (doctrine §15).
 *
 * Each important PIXDRIFT concept has one canonical English term, a definition
 * and its context, so terminology does not drift across products. Translations
 * derive from the canonical English source; approved translations can be added
 * per locale over time without changing meaning.
 */

import type { Locale } from "../i18n/locales.ts";

export interface Term {
  /** Canonical English term. */
  term: string;
  definition: string;
  context: string;
  /** Approved translations by locale; canonical English is authoritative. */
  translations?: Record<string, string>;
  /** Terms that must not be used for this concept. */
  prohibited?: string[];
}

export function terminologyTerm(locale: Locale, item: Term): string {
  return item.translations?.[locale] ?? item.term;
}

export const terminology: Term[] = [
  {
    term: "System",
    definition: "A product developed and operated under PIXDRIFT.",
    context: "Used in the Systems catalog and product pages. Not 'app' or 'solution'.",
    translations: {
      sv: "System",
      pl: "System",
      de: "System",
      es: "Sistema",
      fr: "Système",
      nl: "Systeem",
      it: "Sistema",
      no: "System",
      da: "System",
      fi: "Järjestelmä",
    },
    prohibited: ["app", "solution"],
  },
  {
    term: "Operator",
    definition: "A person who runs a business or process and uses the software to do real work.",
    context: "The audience PIXDRIFT builds for. Not 'user persona'.",
  },
  {
    term: "Verification",
    definition: "A deterministic check that confirms something is true against a source or rule.",
    context: "Distinct from a model inference; verification is authoritative.",
  },
  {
    term: "Source",
    definition: "The authoritative origin of a piece of information.",
    context: "Used when distinguishing facts from inferences or copies.",
  },
  {
    term: "Case",
    definition: "An independent unit of work with its own state and outcome.",
    context: "E.g. a diagnosis case. A container (work order) may hold several cases.",
  },
  {
    term: "Organization",
    definition: "A tenant: the company or authority whose data and access are isolated.",
    context: "Derived from the identity token, never from a request. Not 'account'.",
    prohibited: ["tenant (in UI copy)", "account"],
  },
  {
    term: "Connection",
    definition: "A link that moves information between two systems or parties.",
    context: "The core of the layer between systems.",
  },
  {
    term: "Status",
    definition: "The current operational or lifecycle state of a system or case.",
    context: "System statuses: Operational, Development, Pilot.",
  },
  {
    term: "Stewardship",
    definition:
      "Which of the three outcomes a system is: internal, open source or managed product.",
    context: "A managed product means PIXDRIFT takes operational responsibility for it.",
  },
];
