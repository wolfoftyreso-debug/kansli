import type { Metadata } from "next";

export const site = {
  name: "Landvex",
  tagline: "Engineering between the systems you already run",
  url: "https://landvex.com",
  email: "contact@landvex.com",
  locale: "en",
  copyrightYear: 2026,
  title: "Landvex — Engineering between the systems you already run",
  description:
    "Founder-led engineering in Stockholm and Houston. We build what sits between the big systems: own products, white label, and two to five assignments a year.",
} as const;

export const openGraphIdentity = {
  type: "website",
  locale: "en_US",
  siteName: site.name,
} as const;

// Single source for the generated share card. app/opengraph-image.tsx reads
// the same dimensions, so the declared size cannot drift from the real one.
export const ogImage = { path: "/opengraph-image", width: 1200, height: 630 } as const;

// Canonical and og:url describe the same thing, so one call sets both. Keeping
// them apart is how every page ends up claiming to be the home page. Declaring
// openGraph on a page replaces the root's, so the image is repeated here — drop
// it and subpages lose their share card.
export function pageMetadata(path: string): Metadata {
  return {
    alternates: { canonical: path },
    openGraph: {
      ...openGraphIdentity,
      url: path,
      images: [
        {
          url: ogImage.path,
          width: ogImage.width,
          height: ogImage.height,
          alt: site.title,
        },
      ],
    },
  };
}

export const landvexAb = {
  legalName: "Landvex AB",
  orgNr: "559141-7042",
  vat: "SE559141704201",
  seat: "Tyresö",
  county: "Stockholms län",
  street: "Antennvägen 2",
  postalCode: "135 48",
  city: "Tyresö",
  country: "Sweden",
  countryCode: "SE",
  label: "EU HQ",
} as const;

export const landvexInc = {
  legalName: "Landvex Inc.",
  city: "Houston",
  region: "Texas",
  country: "United States",
  countryCode: "US",
  label: "US HQ",
} as const;

export const nav = [
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#approach", label: "Approach" },
  { href: "/#products", label: "Products" },
  { href: "/#company", label: "Company" },
] as const;

export const legalNav = [
  { href: "/company", label: "Company information" },
  { href: "/privacy", label: "Privacy" },
  { href: "/security", label: "Security" },
] as const;

// `updated` feeds <lastmod> in the sitemap. Move the date when a page's
// content changes; a date that lies is worse than no date at all.
export const indexedRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1, updated: "2026-08-26" },
  { path: "/methodology", changeFrequency: "monthly", priority: 0.6, updated: "2026-08-26" },
  { path: "/company", changeFrequency: "monthly", priority: 0.6, updated: "2026-08-24" },
  { path: "/security", changeFrequency: "monthly", priority: 0.6, updated: "2026-08-26" },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.6, updated: "2026-08-26" },
] as const;
