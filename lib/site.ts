export const site = {
  name: "Landvex",
  tagline: "Founder-led automation engineering on AWS",
  url: "https://landvex.com",
  email: "contact@landvex.com",
  linkedin: "https://www.linkedin.com/company/landvex",
  locale: "en",
  title: "Landvex — Founder-led automation engineering on AWS",
  description:
    "Landvex is a founder-led engineering company with offices in Stockholm and Houston. We design, build and operate automation on AWS.",
  keywords: [
    "AWS automation",
    "process automation",
    "document processing",
    "applied AI",
    "data platforms",
    "AWS consulting",
    "Stockholm",
    "Houston",
    "founder-led engineering",
  ],
  entities: {
    us: {
      name: "Landvex Inc.",
      city: "Houston",
      region: "Texas",
      country: "US",
      label: "US HQ",
    },
    eu: {
      name: "Landvex AB",
      city: "Tyresö",
      region: "Stockholm",
      country: "SE",
      orgNr: "559141-7042",
      label: "EU HQ",
    },
  },
} as const;

export const nav = [
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#approach", label: "Approach" },
  { href: "/#platform", label: "Platform" },
  { href: "/#company", label: "Company" },
] as const;

export const legalNav = [
  { href: "/security", label: "Security" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? site.url;
  return new URL(path, base).toString();
}
