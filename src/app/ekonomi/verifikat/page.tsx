import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { listTransactions } from "@/lib/ekonomi/journal";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verifikat — Ekonomi" };

export default async function VerifikatPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const rows =
    session?.org?.ref && runtime ? await listTransactions(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="ekonomi" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/ekonomi", label: "Ekonomi" },
          { href: "/ekonomi/verifikat", label: "Verifikat" },
        ]}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Verifikat</h1>
      <p className="max-w-xl text-ink-soft">
        Verifikat går aldrig att ändra i efterhand. Skulle någon försöka syns det direkt.
      </p>
      {!session ? (
        <SignInGate next="/ekonomi" title="Logga in för verifikat">
          Verifikaten tillhör organisationen.
        </SignInGate>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.length === 0 ? <p className="text-sm text-muted">Inget bokat ännu.</p> : null}
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <p className="text-sm font-medium">{row.description}</p>
              <p className="mt-1 text-xs text-muted">{row.template}</p>
              <p className="mt-2 break-all font-mono text-xs text-faint">{row.hash}</p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
