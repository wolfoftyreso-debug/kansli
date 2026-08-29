import { Facade } from "@/components/app/Facade";
import { NotFoundChrome } from "@/components/app/NotFoundChrome";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { appRoomRobots } from "@/lib/platform/app-robots";
import { facadeRuntimeMark } from "@/lib/platform/facade";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "idp.errorTitle"),
    description: t(locale, "idp.errorHeading"),
    ...appRoomRobots(),
  };
}

export default async function NotFound() {
  const session = await readSession();
  const locale = await readLocale();
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:border focus:border-line-strong focus:bg-surface focus:px-4 focus:py-2 focus:text-sm"
      >
        {t(locale, "chrome.skipToContent")}
      </a>
      <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
        <NotFoundChrome locale={locale} />
      </Facade>
    </>
  );
}
