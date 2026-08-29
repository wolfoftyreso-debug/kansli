"use client";

import { ErrorChrome } from "@/components/app/ErrorChrome";
import { localeFromCookieHeader } from "@/lib/i18n";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  const locale = localeFromCookieHeader(typeof document === "undefined" ? "" : document.cookie);
  return <ErrorChrome locale={locale} reset={reset} />;
}
