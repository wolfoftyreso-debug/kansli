import { t, type Locale } from "@/lib/i18n";

export function LoadingChrome({ locale }: { locale: Locale }) {
  return <p className="pd-label text-faint">{t(locale, "common.loading")}</p>;
}
