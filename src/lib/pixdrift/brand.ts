/**
 * Canonical PIXDRIFT brand facts, mirrored from the doc-intel brand source
 * (`packages/doc-intel/data/brand.json`). Kept as typed constants for the
 * corporate website so product/company content is never hardcoded ad hoc in
 * components.
 */

export const brand = {
  name: "PIXDRIFT",
  wordmark: "Pixdrift",
  domain: "pixdrift.com",
  url: "https://pixdrift.com",
  tagline: "The layer between systems.",
  /**
   * Secondary, recurring expression. The two pair intentionally:
   * "The layer between systems." says what PIXDRIFT is;
   * "Built because it was missing." says why the products exist.
   */
  secondaryTagline: "Built because it was missing.",
  statement:
    "PIXDRIFT develops focused software for the operational gaps, connections and workflows that remain between the systems organizations already use.",
  /** Doctrine §11 — short corporate version. */
  shortStatement:
    "PIXDRIFT develops software from practical operational problems. Many of our systems begin as tools we build for ourselves after discovering that the obvious solution simply does not exist. When one proves useful beyond our own organization, we either release it openly or take responsibility for operating it as a supported PIXDRIFT product.",
  /** Doctrine §12 — micro version for footer/metadata. */
  microStatement:
    "Practical software for the gaps between systems. Developed from real operational needs and maintained by Landvex.",
  /** English is canonical; localization is supported from the first commit (§14). */
  canonicalLocale: "en",
  locales: ["en", "sv", "de", "fr", "nl", "es", "it", "no", "da", "fi"],
  company: {
    name: "Landvex",
    offices: [
      { city: "Stockholm", country: "Sweden", entity: "Landvex AB" },
      { city: "Houston", country: "United States", entity: "Landvex Inc." },
    ],
  },
} as const;

export type Office = (typeof brand.company.offices)[number];
