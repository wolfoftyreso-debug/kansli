import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { loadRevolutStatement } from "@/lib/ekonomi/revolut";
import { formatMoney } from "@/lib/ekonomi/money";
import { formatDateTime } from "@/lib/format/datetime";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { refreshStatementAction } from "../actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.stmt.metaTitle"),
    description: t(locale, "ekonomi.stmt.metaDescription"),
  };
}

export default async function KontoutdragPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
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
          { href: "/ekonomi/kontoutdrag", label: t(locale, "ekonomi.statements") },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.stmt.heading")}</h1>
      <p className="max-w-xl text-ink-soft">{t(locale, "ekonomi.stmt.lead")}</p>

      {!session ? (
        <SignInGate
          next="/ekonomi/kontoutdrag"
          title={t(locale, "ekonomi.stmt.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.stmt.signInBody")}
        </SignInGate>
      ) : !statement ? (
        <Notice>{t(locale, "ekonomi.stmt.noDb")}</Notice>
      ) : (
        <>
          {statement.source === "revolut" ? (
            <p className="text-sm text-ink-soft">{t(locale, "ekonomi.stmt.live")}</p>
          ) : statement.source === "stored" ? (
            <p className="text-sm text-ink-soft">{t(locale, "ekonomi.stmt.stored")}</p>
          ) : null}

          {statement.error ? <Notice>{statement.error}</Notice> : null}

          {!statement.hasToken ? (
            <section className="rounded-xl border border-line bg-surface px-4 py-4">
              <p className="font-medium">
                {statement.reauthorize
                  ? t(locale, "ekonomi.stmt.reauthTitle")
                  : t(locale, "ekonomi.stmt.disconnectedTitle")}
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {statement.reauthorize
                  ? t(locale, "ekonomi.stmt.reauthBody")
                  : t(locale, "ekonomi.stmt.connectBody")}
              </p>
              <p className="mt-3">
                <Link
                  href="/ekonomi/anslutningar/revolut"
                  className="underline decoration-line underline-offset-4"
                >
                  {statement.reauthorize
                    ? t(locale, "ekonomi.stmt.reconnect")
                    : t(locale, "ekonomi.stmt.connect")}
                </Link>
              </p>
            </section>
          ) : (
            <form action={refreshStatementAction}>
              <Submit>{t(locale, "ekonomi.stmt.refresh")}</Submit>
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
                    {account.name || t(locale, "ekonomi.stmt.account")}
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
            <h2 className="text-lg font-semibold">{t(locale, "ekonomi.stmt.transactions")}</h2>
            {statement.lines.length === 0 ? (
              <p className="text-sm text-muted">
                {statement.hasToken
                  ? t(locale, "ekonomi.stmt.emptyLive")
                  : t(locale, "ekonomi.stmt.empty")}
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
                        {line.bookedAt
                          ? formatDateTime(line.bookedAt, locale)
                          : t(locale, "ekonomi.stmt.noTime")}
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
