import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { INVOICE_STATUS_LABELS, getInvoice, remainingOre } from "@/lib/ekonomi/invoices";
import { formatKronorInput, formatSek, vatLabel } from "@/lib/ekonomi/money";
import { listPayments } from "@/lib/ekonomi/payments";
import { getTransactionEntries } from "@/lib/ekonomi/journal";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { invoiceDocument } from "@/lib/ekonomi/reports";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDate } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { issueInvoiceAction, offerPaymentAction, recordPaymentAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await readSession();
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
          { href: "/ekonomi/fakturor", label: "Fakturor" },
        ]}
      />
      {!session ? (
        <SignInGate next="/ekonomi" title="Logga in för fakturan">
          Enskilt dokument, inte en delad länk än.
        </SignInGate>
      ) : invoice ? (
        <>
          <p className="text-xs uppercase tracking-wide text-accent">
            {INVOICE_STATUS_LABELS[invoice.status]}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{invoice.number}</h1>
          <p className="text-ink-soft">
            {invoice.customerName}
            {invoice.dueAt ? ` · förfaller ${formatSwedishDate(invoice.dueAt)}` : ""}
          </p>

          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Rader</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {invoice.lines.map((line) => (
                <li key={line.id}>
                  {line.description} × {line.quantity} · {formatSek(line.netOre)} · moms{" "}
                  {vatLabel(line.vatRateBps)} · {formatSek(line.grossOre)}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              Netto {formatSek(invoice.netOre)} · Moms {formatSek(invoice.vatOre)} · Att betala{" "}
              {formatSek(invoice.grossOre)} · Kvar {formatSek(remainingOre(invoice))}
            </p>
          </section>

          {invoice.status === "draft" ? (
            <form action={issueInvoiceAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <Submit>Utfärda — faktura 10 dagar</Submit>
            </form>
          ) : null}

          {journal.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold">Bokfört vid utfärdande</h2>
              <ul className="mt-2 text-sm">
                {journal.map((line) => (
                  <li key={`${line.account}-${line.debitOre}-${line.creditOre}`}>
                    {line.account}{" "}
                    {line.debitOre
                      ? `debet ${formatSek(line.debitOre)}`
                      : `kredit ${formatSek(line.creditOre)}`}
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
                <h2 className="text-lg font-semibold">Erbjud betalspår</h2>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <select
                  name="rail"
                  className="mt-3 rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="invoice_10">Faktura 10 dagar</option>
                  <option value="stripe">Stripe</option>
                  <option value="swish">Swish</option>
                  <option value="revolut">Revolut</option>
                </select>
                <p className="mt-2 text-sm text-ink-soft">{rails.stripe.reason}</p>
                <div className="mt-3">
                  <Submit>Skapa erbjudande</Submit>
                </div>
              </form>

              <form
                action={recordPaymentAction}
                className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-4"
              >
                <h2 className="text-lg font-semibold">Boka mottagen betalning</h2>
                <Notice>
                  Använd bara när pengarna faktiskt har kommit in — via Swish, bank eller matchning.
                  Bokningen skapar ett verifikat och går inte att ta bort.
                </Notice>
                <input type="hidden" name="invoiceId" value={invoice.id} />
                <select
                  name="rail"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="invoice_10">Faktura / manuell</option>
                  <option value="stripe">Stripe</option>
                  <option value="swish">Swish</option>
                  <option value="revolut">Revolut</option>
                </select>
                <Field
                  name="amountKronor"
                  label="Belopp, kr"
                  required
                  defaultValue={formatKronorInput(remainingOre(invoice))}
                />
                <Field
                  name="externalRef"
                  label="Extern referens (Swish-nr, Stripe id, Revolut id)"
                />
                <Submit>Boka inbetalning</Submit>
              </form>
            </section>
          ) : null}

          <section>
            <h2 className="text-lg font-semibold">Betalningar</h2>
            {payments.length === 0 ? <p className="text-sm text-muted">Inga ännu.</p> : null}
            <ul className="mt-2 flex flex-col gap-2 text-sm">
              {payments.map((payment) => (
                <li key={payment.id}>
                  {payment.rail} · {payment.status} · {formatSek(payment.amountOre)}
                  {payment.externalRef ? ` · ${payment.externalRef}` : ""}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-paper px-4 py-4">
            <h2 className="text-lg font-semibold">Enskilt dokument</h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-ink-soft">
              {invoiceDocument(invoice, session.org?.name ?? "Organisation")}
            </pre>
            <p className="mt-3 text-sm">
              <Link
                className="underline decoration-line underline-offset-4"
                href={`/api/ekonomi/invoices/${invoice.id}`}
              >
                JSON
              </Link>
            </p>
          </section>
        </>
      ) : null}
    </AppShell>
  );
}
