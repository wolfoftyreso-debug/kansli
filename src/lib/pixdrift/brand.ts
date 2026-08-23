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
  statement:
    "PIXDRIFT develops focused software for the operational gaps, connections and workflows that remain between the systems organizations already use.",
  company: {
    name: "Landvex",
    offices: [
      { city: "Stockholm", country: "Sweden", entity: "Landvex AB" },
      { city: "Houston", country: "United States", entity: "Landvex Inc." },
    ],
  },
} as const;

export type Office = (typeof brand.company.offices)[number];
