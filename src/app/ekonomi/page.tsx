import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { listPayments } from "@/lib/ekonomi/payments";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { agedReceivables } from "@/lib/ekonomi/reports";
import { formatSek } from "@/lib/ekonomi/money";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ekonomi — Pixdrift",
  description: "Gemensam bok och betalspår. Inte Fortnox. Inte påhittade inbetalningar.",
};

export default async function EkonomiPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const invoices =
    session?.org?.ref && runtime ? await listInvoices(runtime.pool, session.org.ref) : [];
  const payments =
    session?.org?.ref && runtime ? await listPayments(runtime.pool, session.org.ref) : [];
  const aged = agedReceivables(invoices);
  const rails = railSnapshot();

  return (
    <AppShell current="ekonomi" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / Ekonomi</p>
        <h1 className="text-3xl font-semibold tracking-tight">Vad är bokat?</h1>
        <p className="max-w-xl text-ink-soft">
          En bok för hela huset. TYRA, IRMA och de andra skapar fordringar här — de skriver inte i
          varandras tabeller. Tre spår mot kund: Swish, Stripe, faktura 10 dagar. Revolut ansluts en
          gång med OAuth och förnyar sin token själv — då kommer kontoutdrag och matchning.
        </p>
      </header>

      {!session ? (
        <SignInGate next="/ekonomi" title="Logga in för att se boken">
          Ekonomi är orgens egen pärm. Inte demonstrationssiffror från BRITT.
        </SignInGate>
      ) : (
        <>
          <Notice>
            Grunden är strikt: öre, BAS-konton, balanserade verifikat, hashkedja. Stripe Checkout
            och Revolut-anrop körs bara med riktig nyckel. 100 simulerade transaktioner väntar på
            ditt OK — inte före.
          </Notice>

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted">Öppna fordringar</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatSek(aged.notDueOre + aged.overdueOre)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{aged.openCount} fakturor</p>
            </article>
            <article className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted">Förfallet</p>
              <p className="mt-2 text-2xl font-semibold">{formatSek(aged.overdueOre)}</p>
              <p className="mt-1 text-sm text-ink-soft">{aged.overdue.length} poster</p>
            </article>
            <article className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-muted">Inbetalningar</p>
              <p className="mt-2 text-2xl font-semibold">
                {formatSek(
                  payments
                    .filter((item) => item.status === "received")
                    .reduce((sum, item) => sum + item.amountOre, 0),
                )}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {payments.filter((item) => item.status === "received").length} bokade
              </p>
            </article>
          </section>

          <nav className="flex flex-wrap gap-3 text-sm">
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/kontoutdrag"
            >
              Kontoutdrag
            </Link>
            <Link className="underline decoration-line underline-offset-4" href="/ekonomi/fakturor">
              Fakturor
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/verifikat"
            >
              Verifikat
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/rapporter"
            >
              Rapporter / moms
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/anslutningar"
            >
              Anslutningar
            </Link>
          </nav>

          <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">Betalspår</h2>
            {Object.values(rails).map((rail) => (
              <p
                key={rail.id}
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
              >
                <span className="font-medium">{rail.label}</span>
                {" — "}
                {rail.offerable ? "kan erbjudas" : "blockerat"}
                {". "}
                {rail.reason}
              </p>
            ))}
          </section>
        </>
      )}
    </AppShell>
  );
}
