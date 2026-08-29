import { Facade } from "@/components/app/Facade";
import { LoadingChrome } from "@/components/app/LoadingChrome";
import { SkipToContent } from "@/components/app/SkipToContent";
import { readSession } from "@/lib/auth/session";
import { readLocale } from "@/lib/i18n/request";
import { facadeRuntimeMark } from "@/lib/platform/facade";

export default async function Loading() {
  const session = await readSession();
  const locale = await readLocale();
  return (
    <>
      <SkipToContent locale={locale} />
      <Facade session={session} runtime={facadeRuntimeMark()} locale={locale}>
        <LoadingChrome locale={locale} />
      </Facade>
    </>
  );
}
