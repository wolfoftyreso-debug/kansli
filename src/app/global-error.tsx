"use client";

import { ErrorChrome } from "@/components/app/ErrorChrome";
import { Facade } from "@/components/app/Facade";
import { SkipToContent } from "@/components/app/SkipToContent";
import { localeFromCookieHeader, localeTag } from "@/lib/i18n";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  const locale = localeFromCookieHeader(typeof document === "undefined" ? "" : document.cookie);
  return (
    <html lang={localeTag(locale)}>
      <body className="flex min-h-full flex-col">
        <SkipToContent locale={locale} />
        <Facade session={null} runtime="local" locale={locale}>
          <ErrorChrome locale={locale} reset={reset} />
        </Facade>
      </body>
    </html>
  );
}
