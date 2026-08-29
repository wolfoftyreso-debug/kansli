import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export function NotFoundChrome({ locale }: { locale: Locale }) {
  return (
    <>
      <p className="pd-label">{t(locale, "idp.errorTitle")}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "idp.errorHeading")}</h1>
      <p>
        <Link href="/" className="underline decoration-line underline-offset-4 hover:text-ink">
          {t(locale, "idp.home")}
        </Link>
      </p>
    </>
  );
}
