import { LoadingChrome } from "@/components/app/LoadingChrome";
import { readLocale } from "@/lib/i18n/request";

export default async function SiteLoading() {
  const locale = await readLocale();
  return <LoadingChrome locale={locale} />;
}
