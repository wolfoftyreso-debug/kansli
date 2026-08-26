export const site = {
  name: "Landvex",
  tagline: "Founder-led automation engineering on AWS",
  url: "https://landvex.com",
  email: "contact@landvex.com",
  locale: "en",
  copyrightYear: 2026,
  title: "Landvex — Founder-led automation engineering on AWS",
  description:
    "Landvex is a founder-led engineering company with offices in Stockholm and Houston. We design, build and operate automation on AWS.",
} as const;

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
  { href: "/#platform", label: "Platform" },
  { href: "/#company", label: "Company" },
] as const;

export const legalNav = [
  { href: "/company", label: "Company information" },
  { href: "/privacy", label: "Privacy" },
  { href: "/security", label: "Security" },
] as const;
