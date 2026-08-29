import { catalogField } from "../i18n/t.ts";
import { brand } from "../pixdrift/brand.ts";
import type { PixSystem } from "../pixdrift/systems.ts";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.url,
    description: brand.statement,
    parentOrganization: {
      "@type": "Organization",
      name: brand.company.name,
    },
    address: brand.company.offices.map((office) => ({
      "@type": "PostalAddress",
      addressLocality: office.city,
      addressCountry: office.country,
    })),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brand.name,
    url: brand.url,
    description: brand.statement,
    publisher: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
  };
}

export function systemJsonLd(system: PixSystem) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: system.name,
    applicationCategory: catalogField("en", system.slug, "category"),
    description: catalogField("en", system.slug, "purpose"),
    url: `${brand.url}/systems/${system.slug}`,
    provider: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
  };
}
