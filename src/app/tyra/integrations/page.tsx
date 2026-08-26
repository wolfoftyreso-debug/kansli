import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, SignInGate } from "@/components/app/SignInGate";
import { StatusBanner } from "@/components/tyra/Status";
import { TaskRow } from "@/components/tyra/Rows";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { listOutbox } from "@/lib/tyra/reminders";
import { listSupplierAccounts, searchSupplierProducts } from "@/lib/tyra/suppliers/gateway";

export const metadata = {
  title: "Integrationer — TYRA",
  description: "Leverantörskonton och påminnelser i kö. Inget skickas än.",
};

export default async function TyraIntegrationsPage() {
  const session = await readSession();
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
          { href: "/tyra/integrations", label: "Integrationer" },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Integrationer</h1>
        <p className="text-ink-soft">
          Här syns leverantörskonton och kön av påminnelser. Inget skickas och inga priser hämtas
          än.
        </p>
      </header>

      {!session?.org ? (
        <SignInGate next="/tyra/integrations" title="Logga in för att se integrationer">
          Leverantörskonton och påminnelser tillhör ert företag.
        </SignInGate>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Leverantörer</h2>
            {probe && !probe.ok ? (
              <StatusBanner tone="attention" title={probe.error.kind}>
                {probe.error.message}
              </StatusBanner>
            ) : null}
            {accounts.length === 0 ? (
              <EmptyState>Inga leverantörskonton än.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {accounts.map((account) => (
                  <li key={account.id}>
                    <TaskRow
                      headline={account.supplierId}
                      subtitle={account.lastErrorMessage ?? account.currency}
                      status={{
                        tone: account.enabled ? "neutral" : "blocked",
                        label: account.enabled ? "Konto" : "Av",
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Påminnelser i kö</h2>
            {outbox.length === 0 ? (
              <EmptyState>Inga köade meddelanden.</EmptyState>
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
