import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { InvoiceLineFields } from "@/components/ekonomi/InvoiceLineFields";
import { INVOICE_STATUS_LABELS, listInvoices } from "@/lib/ekonomi/invoices";
import { formatSek } from "@/lib/ekonomi/money";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDate } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { bookSaleAction, createInvoiceAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Fakturor — Ekonomi" };

export default async function FakturorPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const invoices =
    session?.org?.ref && runtime ? await listInvoices(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/fakturor", label: "Fakturor" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Fakturor</h1>
      <p className="max-w-xl text-ink-soft">
        Utkast bokförs inte. Utfärdad faktura skriver kundfordran, försäljning och utgående moms.
        Förfaller om tio dagar om du inte ändrar det senare.
      </p>

      {!session ? (
        <SignInGate next="/ekonomi" title="Logga in för fakturor">
          Fakturor tillhör organisationen.
        </SignInGate>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted">Inga fakturor ännu.</p>
            ) : null}
            {invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-xl border border-line bg-surface px-4 py-4">
                <p className="text-xs uppercase tracking-wide text-accent">
                  {INVOICE_STATUS_LABELS[invoice.status]}
                </p>
                <p className="mt-1 text-lg font-medium">
                  <Link href={`/ekonomi/fakturor/${invoice.id}`} className="hover:underline">
                    {invoice.number}
                  </Link>
                </p>
                <p className="text-sm text-ink-soft">
                  {invoice.customerName} · {formatSek(invoice.grossOre)}
                  {invoice.dueAt ? ` · förfaller ${formatSwedishDate(invoice.dueAt)}` : ""}
                </p>
              </li>
            ))}
          </ul>

          <form
            action={bookSaleAction}
            className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold">Nytt sälj</h2>
            <Field name="customerName" label="Kund" required />
            <Field name="customerRef" label="Kundreferens (valfritt)" />
            <InvoiceLineFields rows={3} />
            <Notice>
              Skriv kronor. 2 500 eller 2500,50 går bra. Boken sparar öre. Moms 6 % och 0 % går inte
              att boka än — boken har inte de kontona.
            </Notice>
            <div className="flex flex-wrap gap-3">
              <Submit>Boka sälj</Submit>
              <button
                type="submit"
                formAction={createInvoiceAction}
                className="self-start border border-line bg-paper px-4 py-2 text-sm"
              >
                Spara utkast
              </button>
            </div>
          </form>
        </>
      )}
    </AppShell>
  );
}
