import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { JsonLd } from "@/components/json-ld";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s — Landvex",
  },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  authors: [{ name: "Landvex" }],
  creator: "Landvex",
  publisher: "Landvex",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#000028",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": `${site.url}/#organization`,
      name: site.name,
      url: site.url,
      email: site.email,
      description: site.description,
      slogan: site.tagline,
      sameAs: [site.linkedin],
      areaServed: ["EU", "US"],
      knowsAbout: [
        "Process automation",
        "Document and media processing",
        "Applied AI",
        "Data platforms",
        "AWS cloud foundation",
      ],
      parentOrganization: {
        "@type": "Organization",
        name: site.entities.us.name,
        address: {
          "@type": "PostalAddress",
          addressLocality: site.entities.us.city,
          addressRegion: site.entities.us.region,
          addressCountry: site.entities.us.country,
        },
      },
      department: [
        {
          "@type": "Organization",
          name: site.entities.us.name,
          address: {
            "@type": "PostalAddress",
            addressLocality: site.entities.us.city,
            addressRegion: site.entities.us.region,
            addressCountry: site.entities.us.country,
          },
        },
        {
          "@type": "Organization",
          name: site.entities.eu.name,
          identifier: site.entities.eu.orgNr,
          address: {
            "@type": "PostalAddress",
            addressLocality: site.entities.eu.city,
            addressRegion: site.entities.eu.region,
            addressCountry: site.entities.eu.country,
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
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-ink">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <JsonLd data={organizationJsonLd} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
