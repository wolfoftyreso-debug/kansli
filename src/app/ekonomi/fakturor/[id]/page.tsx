import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SelectField, SignInGate, Submit } from "@/components/app/SignInGate";
import { getInvoice, remainingOre } from "@/lib/ekonomi/invoices";
import { formatKronorInput, formatSek, vatLabel } from "@/lib/ekonomi/money";
import { listPayments } from "@/lib/ekonomi/payments";
import { getTransactionEntries } from "@/lib/ekonomi/journal";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { invoiceDocument } from "@/lib/ekonomi/reports";
import { readSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format/datetime";
import { ekonomiInvoiceStatus, ekonomiPayStatus, ekonomiRailLabel, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { issueInvoiceAction, offerPaymentAction, recordPaymentAction } from "../../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.doc.metaTitle"),
    description: t(locale, "ekonomi.doc.metaDescription"),
  };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const invoice =
    session?.org?.ref && runtime ? await getInvoice(runtime.pool, session.org.ref, id) : null;
  if (session && runtime && !invoice) notFound();
  const payments =
    session?.org?.ref && runtime && invoice
      ? await listPayments(runtime.pool, session.org.ref, invoice.id)
      : [];
  const journal =
    session?.org?.ref && runtime && invoice?.issueTransactionId
      ? await getTransactionEntries(runtime.pool, session.org.ref, invoice.issueTransactionId)
      : [];
  const rails = railSnapshot();

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/fakturor", label: t(locale, "ekonomi.invoices") },
        ]}
      />
      {!session ? (
        <SignInGate
          next={`/ekonomi/fakturor/${id}`}
          title={t(locale, "ekonomi.doc.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.doc.signInBody")}
        </SignInGate>
      ) : invoice ? (
        <>
          <p className="text-xs uppercase tracking-wide text-accent">
            {ekonomiInvoiceStatus(locale, invoice.status)}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{invoice.number}</h1>
          <p className="text-ink-soft">
            {invoice.customerName}
            {invoice.dueAt
              ? ` · ${t(locale, "ekonomi.desk.due", { date: formatDate(invoice.dueAt, locale) })}`
              : ""}
          </p>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.lines")}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {invoice.lines.map((line) => (
                <li key={line.id}>
                  {line.description} × {line.quantity} · {formatSek(line.netOre)} ·{" "}
                  {t(locale, "ekonomi.field.vat")} {vatLabel(line.vatRateBps)} ·{" "}
                  {formatSek(line.grossOre)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              {t(locale, "ekonomi.doc.net")} {formatSek(invoice.netOre)}
              {" · "}
              {t(locale, "ekonomi.field.vat")} {formatSek(invoice.vatOre)}
              {" · "}
              {t(locale, "ekonomi.doc.payable")} {formatSek(invoice.grossOre)}
              {" · "}
              {t(locale, "ekonomi.doc.remaining")} {formatSek(remainingOre(invoice))}
            </p>
          </section>

          {invoice.attachmentText ? (
            <section className="rounded-xl border border-line bg-surface px-4 py-4">
              <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.attachment")}</h2>
              <pre className="mt-3 whitespace-pre-wrap font-mono text-xs text-ink-soft">
                {invoice.attachmentText}
              </pre>
            </section>
          ) : null}

          {invoice.status === "draft" ? (
            <form action={issueInvoiceAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Submit>{t(locale, "ekonomi.doc.issue")}</Submit>
            </form>
          ) : null}

          {journal.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.posted")}</h2>
              <ul className="mt-2 text-sm">
                {journal.map((line) => (
                  <li key={`${line.account}-${line.debitOre}-${line.creditOre}`}>
                    {line.account}{" "}
                    {line.debitOre
                      ? t(locale, "ekonomi.doc.debit", { amount: formatSek(line.debitOre) })
                      : t(locale, "ekonomi.doc.credit", { amount: formatSek(line.creditOre) })}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {invoice.status === "issued" || invoice.status === "part_paid" ? (
            <section className="flex flex-col gap-4">
              <form
                action={offerPaymentAction}
                className="rounded-xl border border-line bg-surface px-4 py-4"
              >
                <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.offerRail")}</h2>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <div className="mt-3">
                  <SelectField
                    name="rail"
                    label={t(locale, "ekonomi.doc.rail")}
                    defaultValue="invoice_10"
                    options={[
                      { value: "invoice_10", label: ekonomiRailLabel(locale, "invoice_10") },
                      { value: "stripe", label: ekonomiRailLabel(locale, "stripe") },
                      { value: "swish", label: ekonomiRailLabel(locale, "swish") },
                      { value: "revolut", label: ekonomiRailLabel(locale, "revolut") },
                    ]}
                  />
                </div>
                <p className="mt-2 text-sm text-ink-soft">{rails.stripe.reason}</p>
                <div className="mt-3">
                  <Submit>{t(locale, "ekonomi.doc.offer")}</Submit>
                </div>
              </form>

              <form
                action={recordPaymentAction}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-4"
              >
                <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.record")}</h2>
                <Notice>{t(locale, "ekonomi.doc.recordNotice")}</Notice>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <SelectField
                  name="rail"
                  label={t(locale, "ekonomi.doc.rail")}
                  defaultValue="invoice_10"
                  options={[
                    { value: "invoice_10", label: t(locale, "ekonomi.doc.railManual") },
                    { value: "stripe", label: ekonomiRailLabel(locale, "stripe") },
                    { value: "swish", label: ekonomiRailLabel(locale, "swish") },
                    { value: "revolut", label: ekonomiRailLabel(locale, "revolut") },
                  ]}
                />
                <Field
                  name="amountKronor"
                  label={t(locale, "ekonomi.doc.amount")}
                  required
                  defaultValue={formatKronorInput(remainingOre(invoice))}
                />
                <Field name="externalRef" label={t(locale, "ekonomi.doc.externalRef")} />
                <Submit>{t(locale, "ekonomi.doc.bookPayment")}</Submit>
              </form>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.payments")}</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-muted">{t(locale, "ekonomi.doc.noPayments")}</p>
            ) : null}
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {payments.map((payment) => (
                <li key={payment.id}>
                  {ekonomiRailLabel(locale, payment.rail)} ·{" "}
                  {ekonomiPayStatus(locale, payment.status)} · {formatSek(payment.amountOre)}
                  {payment.externalRef ? ` · ${payment.externalRef}` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-paper px-4 py-4">
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.doc.document")}</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">
              {invoiceDocument(invoice, session.org?.name ?? "Organisation")}
            </pre>
            <p className="mt-3 text-sm">
              <Link
                className="underline decoration-line underline-offset-4"
                href={`/api/ekonomi/invoices/${invoice.id}`}
              >
                {t(locale, "ekonomi.doc.json")}
              </Link>
            </p>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
