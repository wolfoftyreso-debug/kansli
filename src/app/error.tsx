"use client";

import { ErrorChrome } from "@/components/app/ErrorChrome";
import { Facade } from "@/components/app/Facade";
import { SkipToContent } from "@/components/app/SkipToContent";
import { localeFromCookieHeader } from "@/lib/i18n";
import { facadeRuntimeMark } from "@/lib/platform/facade";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const locale = localeFromCookieHeader(typeof document === "undefined" ? "" : document.cookie);
  return (
    <>
      <SkipToContent locale={locale} />
      <Facade session={null} runtime={facadeRuntimeMark()} locale={locale}>
        <ErrorChrome locale={locale} reset={reset} />
      </Facade>
    </>
  );
}
