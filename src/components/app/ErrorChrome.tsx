import Link from "next/link";
import { t, type Locale } from "@/lib/i18n";

export function ErrorChrome({ locale, reset }: { locale: Locale; reset?: () => void }) {
  return (
    <>
      <p className="pd-label">{t(locale, "idp.errorTitle")}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t(locale, "idp.errorHeading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "tasks.genericError")}</p>
      {reset ? (
        <p>
          <button
            type="button"
            onClick={reset}
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            {t(locale, "chrome.tryAgain")}
          </button>
        </p>
      ) : null}
      <p>
        <Link href="/" className="underline decoration-line underline-offset-4 hover:text-ink">
          {t(locale, "idp.home")}
        </Link>
      </p>
    </>
  );
}
