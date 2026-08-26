import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb, SystemLink } from "@/components/app/ProductCrumb";
import { SalesBoard } from "@/components/ekonomi/SalesBoard";
import { SalesDesk } from "@/components/ekonomi/SalesDesk";
import { CheckField, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { listInvoices } from "@/lib/ekonomi/invoices";
import { listPayments } from "@/lib/ekonomi/payments";
import { railSnapshot } from "@/lib/ekonomi/rails";
import { agedReceivables } from "@/lib/ekonomi/reports";
import { formatSek } from "@/lib/ekonomi/money";
import { buildDailyLedger } from "@/lib/ekonomi/series";
import { getSalesAlertSettings, listSalesAlerts } from "@/lib/ekonomi/sales-alerts";
import { listUnbookedTyraQuotes } from "@/lib/ekonomi/tyra-sales";
import { smsConfigured } from "@/lib/platform/sms";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { saveSalesAlertAction } from "./actions";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "ekonomi.metaTitle"),
    description: t(locale, "ekonomi.metaDescription"),
  };
}

const ALERT_STATUS: Record<string, string> = {
  PENDING: "Väntar",
  SENT: "Skickat",
  FAILED: "Misslyckades",
  BLOCKED: "Stoppat",
};

export default async function EkonomiPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const invoices =
    session?.org?.ref && runtime ? await listInvoices(runtime.pool, session.org.ref) : [];
  const quotes =
    session?.org?.ref && runtime ? await listUnbookedTyraQuotes(runtime.pool, session.org.ref) : [];
  const payments =
    session?.org?.ref && runtime ? await listPayments(runtime.pool, session.org.ref) : [];
  const alerts =
    session?.org?.ref && runtime ? await listSalesAlerts(runtime.pool, session.org.ref) : [];
  const alertSettings =
    session?.org?.ref && runtime
      ? await getSalesAlertSettings(runtime.pool, session.org.ref)
      : null;
  const aged = agedReceivables(invoices);
  const rails = railSnapshot();
  const points = buildDailyLedger(invoices, payments);
  const vendorReady = smsConfigured();

  return (
    <AppShell current="ekonomi" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/ekonomi", label: "Ekonomi" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "ekonomi.heading")}</h1>
        <p className="max-w-xl text-ink-soft">
          {t(locale, "ekonomi.lead")} <SystemLink id="tyra">TYRA</SystemLink>
          {" · "}
          <SystemLink id="revolut">Revolut</SystemLink>
        </p>
        <p className="text-sm">
          <Link href="/kansli/beredskap" className="underline decoration-line underline-offset-4">
            {t(locale, "kansli.firstCustomer")}
          </Link>
        </p>
      </header>

      {!session ? (
        <SignInGate
          next="/ekonomi"
          title={t(locale, "ekonomi.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "ekonomi.signInBody")}
        </SignInGate>
      ) : (
        <>
          <Notice>{t(locale, "ekonomi.notice")}</Notice>

          <SalesDesk
            drafts={invoices.filter((invoice) => invoice.status === "draft")}
            open={aged.notDue}
            overdue={aged.overdue}
            quotes={quotes}
          />

          <SalesBoard points={points} />

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

          <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
            <form
              action={saveSalesAlertAction}
              className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-4"
            >
              <h2 className="text-lg font-semibold">SMS när ni säljer</h2>
              <p className="text-sm text-ink-soft">
                Ett kort meddelande går ut när en faktura utfärdas. Inte när ett utkast sparas.
                {vendorReady
                  ? " Telefonen är kopplad."
                  : " Numret sparas nu. SMS går inte ut förrän telefonen är kopplad i drift."}
              </p>
              <Field
                name="phone"
                label="Mobilnummer"
                type="tel"
                required
                defaultValue={alertSettings?.phone ?? ""}
                placeholder="070-123 45 67"
              />
              <CheckField
                name="enabled"
                label="Skicka SMS vid sälj"
                defaultChecked={alertSettings?.enabled ?? true}
              />
              <Submit>Spara SMS</Submit>
            </form>
            <div className="rounded-xl border border-line bg-surface px-4 py-4">
              <h2 className="text-lg font-semibold">Senaste SMS</h2>
              {alerts.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Inga säljnotiser ännu.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <li key={alert.id} className="text-sm">
                      <p className="text-xs uppercase tracking-wide text-muted">
                        {ALERT_STATUS[alert.status] ?? alert.status}
                      </p>
                      <p className="mt-1 text-ink-soft">{alert.body}</p>
                      <p className="mt-1 text-xs text-muted">
                        {formatDateTime(alert.createdAt, locale)}
                        {alert.lastError ? ` · ${alert.lastError}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <nav className="flex flex-wrap gap-3 text-sm">
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/kontoutdrag"
            >
              {t(locale, "ekonomi.statements")}
            </Link>
            <Link className="underline decoration-line underline-offset-4" href="/ekonomi/fakturor">
              {t(locale, "ekonomi.invoices")}
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/verifikat"
            >
              {t(locale, "ekonomi.vouchers")}
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/rapporter"
            >
              {t(locale, "ekonomi.reports")}
            </Link>
            <Link
              className="underline decoration-line underline-offset-4"
              href="/ekonomi/anslutningar"
            >
              {t(locale, "ekonomi.connections")}
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
