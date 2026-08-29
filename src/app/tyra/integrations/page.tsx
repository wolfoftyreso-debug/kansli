import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { listOutbox } from "@/lib/tyra/reminders";
import { listSupplierAccounts, searchSupplierProducts } from "@/lib/tyra/suppliers/gateway";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tyra.int.metaTitle"),
    description: t(locale, "tyra.int.metaDescription"),
  };
}

export default async function TyraIntegrationsPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const orgRef = session?.org?.ref;
  const accounts = orgRef && runtime ? await listSupplierAccounts(runtime.pool, orgRef) : [];
  const outbox = orgRef && runtime ? await listOutbox(runtime.pool, orgRef) : [];
  const probe =
    orgRef && runtime
      ? await searchSupplierProducts({
          pool: runtime.pool,
          orgRef,
          identity: { width: 225, aspectRatio: 45, rimDiameter: 17, season: "winter" },
        })
      : null;

  return (
    <AppShell current="tyra" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/tyra", label: "TYRA" },
          { href: "/tyra/integrations", label: t(locale, "tyra.integrations") },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "tyra.int.heading")}</h1>
        <p className="text-ink-soft">{t(locale, "tyra.int.lead")}</p>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/tyra/integrations"
          title={t(locale, "tyra.int.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "tyra.int.signInBody")}
        </SignInGate>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "tyra.int.suppliers")}</h2>
            {probe && !probe.ok ? (
              <StatusBanner tone="attention" title={probe.error.kind}>
                {probe.error.message}
              </StatusBanner>
            ) : null}
            {accounts.length === 0 ? (
              <EmptyState>{t(locale, "tyra.int.emptySuppliers")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <li key={account.id}>
                    <TaskRow
                      headline={account.supplierId}
                      subtitle={account.lastErrorMessage ?? account.currency}
                      status={{
                        tone: account.enabled ? "neutral" : "blocked",
                        label: account.enabled
                          ? t(locale, "tyra.int.accountOn")
                          : t(locale, "tyra.int.accountOff"),
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "tyra.int.reminders")}</h2>
            {outbox.length === 0 ? (
              <EmptyState>{t(locale, "tyra.int.emptyReminders")}</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {outbox.map((row) => (
                  <li key={row.id}>
                    <TaskRow
                      headline={row.subject ?? row.channel}
                      subtitle={`${row.channel} · ${row.recipient}${row.lastError ? ` · ${row.lastError}` : ""}`}
                      status={{
                        tone:
                          row.status === "BLOCKED" || row.status === "FAILED"
                            ? "blocked"
                            : row.status === "SENT"
                              ? "good"
                              : "attention",
                        label: row.status,
                      }}
                    />
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
