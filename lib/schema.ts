import { landvexAb, landvexInc, site } from "./site.ts";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${site.url}/#organization`,
      name: site.name,
      legalName: landvexAb.legalName,
      url: site.url,
      email: site.email,
      vatID: landvexAb.vat,
      description: site.description,
      slogan: site.tagline,
      address: {
        "@type": "PostalAddress",
        streetAddress: landvexAb.street,
        postalCode: landvexAb.postalCode,
        addressLocality: landvexAb.city,
        addressCountry: landvexAb.countryCode,
      },
      location: [
        {
          "@type": "Place",
          name: landvexAb.label,
          address: {
            "@type": "PostalAddress",
            streetAddress: landvexAb.street,
            postalCode: landvexAb.postalCode,
            addressLocality: landvexAb.city,
            addressCountry: landvexAb.countryCode,
          },
        },
        {
          "@type": "Place",
          name: landvexInc.label,
          address: {
            "@type": "PostalAddress",
            addressLocality: landvexInc.city,
            addressRegion: landvexInc.region,
            addressCountry: landvexInc.countryCode,
          },
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      publisher: { "@id": `${site.url}/#organization` },
      inLanguage: site.locale,
    },
  ],
};
