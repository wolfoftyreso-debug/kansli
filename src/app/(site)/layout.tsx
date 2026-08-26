import type { ReactNode } from "react";
import { Facade } from "@/components/app/Facade";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { facadeRuntimeMark } from "@/lib/platform/facade";
import { brand } from "@/lib/pixdrift/brand";

const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: brand.name,
  url: brand.url,
  description: brand.statement,
  parentOrganization: {
    "@type": "Organization",
    name: brand.company.name,
  },
  address: brand.company.offices.map((o) => ({
    "@type": "PostalAddress",
    addressLocality: o.city,
    addressCountry: o.country,
  })),
};

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  const locale = await readLocale();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:py-2 focus:text-sm"
      >
        {t(locale, "chrome.skipToContent")}
      </a>
      <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
        {children}
      </Facade>
    </>
  );
}
