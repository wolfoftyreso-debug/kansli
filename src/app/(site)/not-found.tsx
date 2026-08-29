import { NotFoundChrome } from "@/components/app/NotFoundChrome";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { appRoomRobots } from "@/lib/platform/app-robots";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "idp.errorTitle"),
    description: t(locale, "idp.errorHeading"),
    ...appRoomRobots(),
  };
}

export default async function SiteNotFound() {
  const locale = await readLocale();
  return <NotFoundChrome locale={locale} />;
}
