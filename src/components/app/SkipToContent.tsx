import { t, type Locale } from "@/lib/i18n";

export function SkipToContent({ locale }: { locale: Locale }) {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:py-2 focus:text-sm"
    >
      {t(locale, "chrome.skipToContent")}
    </a>
  );
}
