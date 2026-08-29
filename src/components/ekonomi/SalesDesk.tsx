import Link from "next/link";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { bookSaleAction, bookTyraQuoteAction, issueInvoiceAction } from "@/app/ekonomi/actions";
import { InvoiceLineFields } from "@/components/ekonomi/InvoiceLineFields";
import { remainingOre, type Invoice } from "@/lib/ekonomi/invoices";
import { formatSek } from "@/lib/ekonomi/money";
import type { UnbookedTyraQuote } from "@/lib/ekonomi/tyra-sales";
import { formatDate } from "@/lib/format/datetime";
import { ekonomiInvoiceStatus, t, type Locale } from "@/lib/i18n";

function InvoiceRow({
  invoice,
  action,
  locale,
}: {
  invoice: Invoice;
  action?: "issue";
  locale: Locale;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-3 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {ekonomiInvoiceStatus(locale, invoice.status)}
        </p>
        <p className="font-medium">
          <Link href={`/ekonomi/fakturor/${invoice.id}`} className="hover:underline">
            {invoice.number}
          </Link>
          {" · "}
          {invoice.customerName}
        </p>
        <p className="text-sm text-ink-soft">
          {formatSek(remainingOre(invoice))}
          {invoice.dueAt
            ? ` · ${t(locale, "ekonomi.desk.due", { date: formatDate(invoice.dueAt, locale) })}`
            : ""}
        </p>
      </div>
      {action === "issue" ? (
        <form action={issueInvoiceAction}>
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <Submit>{t(locale, "ekonomi.desk.issue")}</Submit>
        </form>
      ) : (
        <Link
          href={`/ekonomi/fakturor/${invoice.id}`}
          className="border border-line bg-paper px-3 py-2 text-sm"
        >
          {t(locale, "ekonomi.desk.openInvoice")}
        </Link>
      )}
    </li>
  );
}

export function SalesDesk({
  drafts,
  open,
  overdue,
  quotes,
  locale,
}: {
  drafts: Invoice[];
  open: Invoice[];
  overdue: Invoice[];
  quotes: UnbookedTyraQuote[];
  locale: Locale;
}) {
  const waiting = drafts.length + open.length + overdue.length + quotes.length;

  return (
    <section className="flex flex-col gap-6 border border-line bg-surface px-4 py-4">
      <div>
        <h2 className="text-lg font-semibold">{t(locale, "ekonomi.desk.queueTitle")}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t(locale, "ekonomi.desk.queueLead")}</p>
      </div>

      <form
        action={bookSaleAction}
        className="flex flex-col gap-3 border border-line bg-paper px-3 py-3"
      >
        <input type="hidden" name="stay" value="1" />
        <h3 className="font-medium">{t(locale, "ekonomi.desk.newSale")}</h3>
        <Field name="customerName" label={t(locale, "tyra.field.customer")} required large />
        <InvoiceLineFields rows={1} locale={locale} />
        <Submit large>{t(locale, "tyra.case.bookSale")}</Submit>
      </form>

      {waiting === 0 ? (
        <p className="text-sm text-muted">{t(locale, "ekonomi.desk.empty")}</p>
      ) : null}

      {quotes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{t(locale, "ekonomi.desk.quotes")}</h3>
          <Notice>{t(locale, "ekonomi.desk.quotesNotice")}</Notice>
          <ul className="flex flex-col gap-2">
            {quotes.map((quote) => (
              <li
                key={quote.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-3 py-3"
              >
                <div>
                  <p className="font-medium">
                    {quote.customerName} · {quote.title}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {formatSek(quote.totalCustomerPriceOre)}
                    {" · "}
                    <Link href={`/tyra/cases/${quote.tireCaseId}`} className="underline">
                      {t(locale, "ekonomi.desk.caseLink")}
                    </Link>
                  </p>
                </div>
                <form action={bookTyraQuoteAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="tireCaseId" value={quote.tireCaseId} />
                  <Submit>{t(locale, "tyra.case.bookSale")}</Submit>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{t(locale, "ekonomi.desk.drafts")}</h3>
          <ul className="flex flex-col gap-2">
            {drafts.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} action="issue" locale={locale} />
            ))}
          </ul>
        </div>
      ) : null}

      {overdue.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{t(locale, "ekonomi.desk.overdue")}</h3>
          <ul className="flex flex-col gap-2">
            {overdue.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} locale={locale} />
            ))}
          </ul>
        </div>
      ) : null}

      {open.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">{t(locale, "ekonomi.desk.open")}</h3>
          <ul className="flex flex-col gap-2">
            {open.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} locale={locale} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
