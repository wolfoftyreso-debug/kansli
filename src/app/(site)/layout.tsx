import type { ReactNode } from "react";
import { Facade } from "@/components/app/Facade";
import { SkipToContent } from "@/components/app/SkipToContent";
import { readSession } from "@/lib/auth/session";
import { readLocale } from "@/lib/i18n/request";
import { facadeRuntimeMark } from "@/lib/platform/facade";
import { organizationJsonLd, websiteJsonLd } from "@/lib/platform/jsonld";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  const locale = await readLocale();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
      />
      <SkipToContent locale={locale} />
      <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
        {children}
      </Facade>
    </>
  );
}
