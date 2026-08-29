import { Facade } from "@/components/app/Facade";
import { NotFoundChrome } from "@/components/app/NotFoundChrome";
import { SkipToContent } from "@/components/app/SkipToContent";
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
      <SkipToContent locale={locale} />
      <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
        <NotFoundChrome locale={locale} />
      </Facade>
    </>
  );
}
