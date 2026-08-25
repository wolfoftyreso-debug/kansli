import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { INVOICE_STATUS_LABELS, listInvoices } from "@/lib/ekonomi/invoices";
import { formatSek, vatLabel } from "@/lib/ekonomi/money";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDate } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import { createInvoiceAction } from "../actions";

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
            action={createInvoiceAction}
            className="flex flex-col gap-4 rounded-xl border border-line bg-surface px-4 py-4"
          >
            <h2 className="text-lg font-semibold">Ny faktura</h2>
            <Field name="customerName" label="Kund" required />
            <Field name="customerRef" label="Kundreferens (valfritt)" />
            <Field name="sourceSystem" label="Källsystem (valfritt)" />
            <Field name="sourceRef" label="Källid (valfritt)" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field name="description" label="Rad 1" required placeholder="Onboarding" />
              <Field name="quantity" label="Antal" defaultValue="1" />
              <Field name="unitNetOre" label="Á-pris netto, öre" required placeholder="250000" />
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Moms</span>
                <select
                  name="vatRateBps"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  defaultValue="2500"
                >
                  <option value="2500">{vatLabel(2500)}</option>
                  <option value="1200">{vatLabel(1200)}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-ink-soft">Slag</span>
                <select
                  name="kind"
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                  defaultValue="service"
                >
                  <option value="service">Tjänst</option>
                  <option value="goods">Vara</option>
                </select>
              </label>
            </div>
            <Notice>
              Belopp i öre. 10 000 = 100 kr. Inga kommatecken. Moms 6 % och 0 % går inte att boka än
              — boken har inte de kontona.
            </Notice>
            <Submit>Spara utkast</Submit>
          </form>
        </>
      )}
    </AppShell>
  );
}
