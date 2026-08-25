import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { formatSek, vatLabel } from "@/lib/ekonomi/money";
import { agedReceivables, vatReport } from "@/lib/ekonomi/reports";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rapporter — Ekonomi" };

export default async function RapporterPage() {
  const session = await readSession();
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
          { href: "/ekonomi/rapporter", label: "Rapporter" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Moms och fordringar</h1>
      <p className="max-w-xl text-ink-soft">
        Perioden är innevarande kalenderår. Exporten är CSV från bokförda fakturor — inte en
        Skatteverket-fil än.
      </p>
      {!session ? (
        <SignInGate next="/ekonomi" title="Logga in för rapporter">
          Moms och fordringar tillhör organisationen.
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Utgående moms</h2>
            {vat.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Inget utfärdat i år.</p>
            ) : null}
            <ul className="mt-3 flex flex-col gap-2 text-sm">
              {vat.map((bucket) => (
                <li key={bucket.rateBps}>
                  {vatLabel(bucket.rateBps)} · underlag {formatSek(bucket.netOre)} · moms{" "}
                  {formatSek(bucket.vatOre)}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <h2 className="text-lg font-semibold">Åldrade kundfordringar</h2>
            <p className="mt-2 text-sm">
              Inte förfallet {formatSek(aged.notDueOre)} · Förfallet {formatSek(aged.overdueOre)}
            </p>
          </section>
          <p className="text-sm">
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=vat"
            >
              Moms CSV
            </Link>
            {" · "}
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=journal"
            >
              Verifikat CSV
            </Link>
            {" · "}
            <Link
              className="underline decoration-line underline-offset-4"
              href="/api/ekonomi/reports?kind=aged"
            >
              Fordringar JSON
            </Link>
          </p>
        </>
      )}
    </AppShell>
  );
}
