import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { formatSek, vatLabel } from "@/lib/ekonomi/money";
import { agedReceivables, vatReport } from "@/lib/ekonomi/reports";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.rep.metaTitle"),
    description: t(locale, "ekonomi.rep.metaDescription"),
  };
}

export default async function RapporterPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const invoices =
    session?.org?.ref && runtime ? await listInvoices(runtime.pool, session.org.ref) : [];
  const from = new Date(new Date().getUTCFullYear(), 0, 1);
  const to = new Date();
  const vat = vatReport(invoices, from, to);
  const aged = agedReceivables(invoices);

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/rapporter", label: t(locale, "ekonomi.reports") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.rep.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.rep.lead")}</p>
      {!session ? (
        <SignInGate
          next="/ekonomi/rapporter"
          title={t(locale, "ekonomi.rep.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.rep.signInBody")}
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.rep.vatOut")}</h2>
            {vat.length === 0 ? (
              <p className="mt-2 text-sm text-muted">{t(locale, "ekonomi.rep.emptyVat")}</p>
            ) : null}
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {vat.map((bucket) => (
                <li key={bucket.rateBps}>
                  {t(locale, "ekonomi.rep.vatLine", {
                    rate: vatLabel(bucket.rateBps),
                    net: formatSek(bucket.netOre),
                    vat: formatSek(bucket.vatOre),
                  })}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.rep.aged")}</h2>
            <p className="mt-2 text-sm">
              {t(locale, "ekonomi.rep.agedLine", {
                open: formatSek(aged.notDueOre),
                overdue: formatSek(aged.overdueOre),
              })}
            </p>
          </section>
          <p className="text-sm">
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=vat"
            >
              {t(locale, "ekonomi.rep.vatCsv")}
            </Link>
            {" · "}
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=journal"
            >
              {t(locale, "ekonomi.rep.journalCsv")}
            </Link>
            {" · "}
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=aged"
            >
              {t(locale, "ekonomi.rep.agedJson")}
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
