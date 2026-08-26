import Link from "next/link";
import { Field, Notice, Submit } from "@/components/app/SignInGate";
import { bookSaleAction, bookTyraQuoteAction, issueInvoiceAction } from "@/app/ekonomi/actions";
import { InvoiceLineFields } from "@/components/ekonomi/InvoiceLineFields";
import { INVOICE_STATUS_LABELS, remainingOre, type Invoice } from "@/lib/ekonomi/invoices";
import { formatSek } from "@/lib/ekonomi/money";
import type { UnbookedTyraQuote } from "@/lib/ekonomi/tyra-sales";
import { formatSwedishDate } from "@/lib/format/datetime";

function InvoiceRow({ invoice, action }: { invoice: Invoice; action?: "issue" }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-3 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">
          {INVOICE_STATUS_LABELS[invoice.status]}
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
          {invoice.dueAt ? ` · förfaller ${formatSwedishDate(invoice.dueAt)}` : ""}
        </p>
      </div>
      {action === "issue" ? (
        <form action={issueInvoiceAction}>
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <Submit>Utfärda</Submit>
        </form>
      ) : (
        <Link
          href={`/ekonomi/fakturor/${invoice.id}`}
          className="border border-line bg-paper px-3 py-2 text-sm"
        >
          Öppna
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
}: {
  drafts: Invoice[];
  open: Invoice[];
  overdue: Invoice[];
  quotes: UnbookedTyraQuote[];
}) {
  const waiting = drafts.length + open.length + overdue.length + quotes.length;

  return (
    <section className="flex flex-col gap-6 border border-line bg-surface px-4 py-4">
      <div>
        <h2 className="text-lg font-semibold">Sälj att boka</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Ett klick bokar och utfärdar. Utkast bokförs inte. TYRA-offerter bokas till kundpriset,
          inklusive 25 % moms, som vara.
        </p>
      </div>

      <form
        action={bookSaleAction}
        className="flex flex-col gap-3 border border-line bg-paper px-3 py-3"
      >
        <input type="hidden" name="stay" value="1" />
        <h3 className="font-medium">Nytt sälj</h3>
        <Field name="customerName" label="Kund" required />
        <InvoiceLineFields rows={1} />
        <Submit>Boka sälj</Submit>
      </form>

      {waiting === 0 ? (
        <p className="text-sm text-muted">
          Kön är tom. Boka nästa sälj här eller från en offert i TYRA.
        </p>
      ) : null}

      {quotes.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">TYRA-offerter som inte är bokade</h3>
          <Notice>Kundpriset är det ni skrev i offerten. Inga live-leverantörspriser.</Notice>
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
                      ärendet
                    </Link>
                  </p>
                </div>
                <form action={bookTyraQuoteAction}>
                  <input type="hidden" name="quoteId" value={quote.id} />
                  <input type="hidden" name="tireCaseId" value={quote.tireCaseId} />
                  <Submit>Boka sälj</Submit>
                </form>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {drafts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Utkast</h3>
          <ul className="flex flex-col gap-2">
            {drafts.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} action="issue" />
            ))}
          </ul>
        </div>
      ) : null}

      {overdue.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Förfallet</h3>
          <ul className="flex flex-col gap-2">
            {overdue.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        </div>
      ) : null}

      {open.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="font-medium">Öppna fakturor</h3>
          <ul className="flex flex-col gap-2">
            {open.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
