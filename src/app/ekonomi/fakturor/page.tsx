import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { InvoiceLineFields } from "@/components/ekonomi/InvoiceLineFields";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { formatSek } from "@/lib/ekonomi/money";
import { readSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format/datetime";
import { ekonomiInvoiceStatus, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { bookSaleAction, createInvoiceAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.inv.metaTitle"),
    description: t(locale, "ekonomi.inv.metaDescription"),
  };
}

export default async function FakturorPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const invoices =
    session?.org?.ref && runtime ? await listInvoices(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/fakturor", label: t(locale, "ekonomi.invoices") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.inv.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.inv.lead")}</p>

      {!session ? (
        <SignInGate
          next="/ekonomi/fakturor"
          title={t(locale, "ekonomi.inv.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.inv.signInBody")}
        </SignInGate>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted">{t(locale, "ekonomi.inv.empty")}</p>
            ) : null}
            {invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-xl border border-line bg-surface px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-accent">
                  {ekonomiInvoiceStatus(locale, invoice.status)}
                </p>
                <p className="mt-1 text-lg font-medium">
                  <Link href={`/ekonomi/fakturor/${invoice.id}`} className="hover:underline">
                    {invoice.number}
                  </Link>
                </p>
                <p className="text-sm text-ink-soft">
                  {invoice.customerName} · {formatSek(invoice.grossOre)}
                  {invoice.dueAt
                    ? ` · ${t(locale, "ekonomi.desk.due", { date: formatDate(invoice.dueAt, locale) })}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>

          <form
            action={bookSaleAction}
            className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.desk.newSale")}</h2>
            <Field name="customerName" label={t(locale, "tyra.field.customer")} required large />
            <Field name="customerRef" label={t(locale, "ekonomi.field.customerRef")} large />
            <InvoiceLineFields rows={3} locale={locale} />
            <Notice>{t(locale, "ekonomi.inv.notice")}</Notice>
            <div className="flex flex-wrap gap-3">
              <Submit large>{t(locale, "tyra.case.bookSale")}</Submit>
              <button
                type="submit"
                formAction={createInvoiceAction}
                className="min-h-12 self-start border border-line bg-paper px-4 py-3 text-base"
              >
                {t(locale, "ekonomi.inv.saveDraft")}
              </button>
            </div>
          </form>
        </>
      )}
    </AppShell>
  );
}
