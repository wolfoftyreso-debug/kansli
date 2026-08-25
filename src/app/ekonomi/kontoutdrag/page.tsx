import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { loadRevolutStatement } from "@/lib/ekonomi/revolut";
import { formatMoney } from "@/lib/ekonomi/money";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { refreshStatementAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kontoutdrag — Ekonomi" };

export default async function KontoutdragPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const statement =
    session?.org?.ref && runtime
      ? await loadRevolutStatement({
          pool: runtime.pool,
          orgRef: session.org.ref,
          events: runtime.events,
        })
      : null;

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/kontoutdrag", label: "Kontoutdrag" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Kontoutdrag</h1>
      <p className="max-w-xl text-ink-soft">
        Saldo och transaktioner från Revolut Business. Utan anslutning är listan tom.
      </p>

      {!session ? (
        <SignInGate next="/ekonomi/kontoutdrag" title="Logga in för kontoutdrag">
          Utdraget tillhör organisationen.
        </SignInGate>
      ) : !statement ? (
        <Notice>Databasen är inte tillgänglig. Utdraget kan inte hämtas.</Notice>
      ) : (
        <>
          {statement.source === "revolut" ? (
            <p className="text-sm text-ink-soft">Hämtat från Revolut just nu.</p>
          ) : statement.source === "stored" ? (
            <p className="text-sm text-ink-soft">
              Det här är senast sparade uppgifter. Vi kunde inte hämta nya just nu.
            </p>
          ) : null}

          {statement.error ? <Notice>{statement.error}</Notice> : null}

          {!statement.hasToken ? (
            <section className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="font-medium">
                {statement.reauthorize ? "Revolut måste anslutas om" : "Revolut är inte ansluten"}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {statement.reauthorize
                  ? "Revolut har stängt anslutningen. Ett tryck på Anslut om ger tillbaka utdraget."
                  : "Revolut släpper inte ut kontoutdraget utan en anslutning. Anslut en gång — sen sköter det sig självt."}
              </p>
              <p className="mt-3">
                <Link
                  href="/ekonomi/anslutningar/revolut"
                  className="underline decoration-line underline-offset-4"
                >
                  {statement.reauthorize ? "Anslut om Revolut" : "Anslut Revolut"}
                </Link>
              </p>
            </section>
          ) : (
            <form action={refreshStatementAction}>
              <Submit>Hämta från Revolut</Submit>
            </form>
          )}

          {statement.accounts.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2">
              {statement.accounts.map((account) => (
                <article
                  key={account.id}
                  className="rounded-xl border border-line bg-surface px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-wide text-muted">
                    {account.name || "Konto"}
                    {account.state ? ` · ${account.state}` : ""}
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {formatMoney(Math.round(account.balance * 100), account.currency)}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{account.currency}</p>
                </article>
              ))}
            </section>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Transaktioner</h2>
            {statement.lines.length === 0 ? (
              <p className="text-sm text-muted">
                {statement.hasToken
                  ? "Revolut lämnade inga rader för perioden."
                  : "Inget utdrag att visa."}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {statement.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{line.reference || line.type}</p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {line.bookedAt ? formatSwedishDateTime(line.bookedAt) : "utan tid"}
                        {` · ${line.state}`}
                      </p>
                    </div>
                    <p
                      className={
                        line.direction === "out"
                          ? "shrink-0 font-medium text-ink"
                          : "shrink-0 font-medium"
                      }
                    >
                      {formatMoney(line.amountOre, line.currency)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
