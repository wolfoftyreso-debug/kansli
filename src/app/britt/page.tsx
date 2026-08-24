import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { listFindings, listRuns, listSnapshots } from "@/lib/britt/intel";
import { listObservations } from "@/lib/britt/observations";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { recordObservation, runBrittIntel } from "./actions";

export const metadata = {
  title: "BRITT — Pixdrift",
  description: "Operativa observationer och uppföljning.",
};

const kr = (value: number) =>
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";

export default async function BrittPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const orgRef = session?.org?.ref;
  const observations = orgRef && runtime ? await listObservations(runtime.pool, orgRef) : [];
  const findings = orgRef && runtime ? await listFindings(runtime.pool, orgRef) : [];
  const snapshots = orgRef && runtime ? await listSnapshots(runtime.pool, orgRef) : [];
  const runs = orgRef && runtime ? await listRuns(runtime.pool, orgRef) : [];
  const latest = snapshots[0];

  return (
    <AppShell current="britt" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / BRITT</p>
        <h1 className="text-3xl font-semibold tracking-tight">BRITT</h1>
        <p className="text-ink-soft">
          Observationer och en deterministisk demonstrationsanalys. BRITT skriver bara i sitt eget
          schema. Inga Fortnox- eller Revolut-kopplingar.
        </p>
        <Notice>
          Siffrorna är demonstrationsfakta för Exempelbolaget, inte livebokföring. Höga fynd blir
          observationer via händelseloggen.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/britt" title="Logga in för att se observationer">
          Observationer är per organisation. Synk från TORA, RITA och IRMA syns här när de
          publicerar.
        </SignInGate>
      ) : (
        <>
          {latest ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Senaste ögonblicksbild · {latest.period}</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Omsättning" value={kr(latest.revenue)} />
                <MetricCard label="Plan" value={kr(latest.planRevenue)} />
                <MetricCard label="Kassa" value={kr(latest.cash)} />
                <MetricCard label="Månadsförbränning" value={kr(latest.monthlyBurn)} />
                <MetricCard
                  label="Största kund"
                  value={`${Math.round(latest.topCustomerShare * 100)} %`}
                />
              </div>
            </section>
          ) : null}

          <form action={runBrittIntel} className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Demonstrationsanalys</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Kör omsättning mot plan, likviditet och kundkoncentration mot seedade fakta.
            </p>
            {runs[0] ? (
              <p className="mt-1 font-mono text-xs text-faint">
                {runs[0].findingCount} fynd · {runs[0].createdAt}
              </p>
            ) : null}
            <div className="mt-3">
              <Submit>Kör analys</Submit>
            </div>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Fynd</h2>
            {findings.length === 0 ? (
              <EmptyState>Inga fynd ännu. Kör demonstrationsanalysen.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {findings.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.severity} · {item.category}
                    </p>
                    <p className="mt-2 font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
                    {item.evidence.length > 0 ? (
                      <ul className="mt-2 font-mono text-xs text-faint">
                        {item.evidence.map((row) => (
                          <li key={row.label}>
                            {row.label}: {row.value}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <form action={recordObservation} className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Ny observation</h2>
            <Field name="title" label="Rubrik" required />
            <Field name="body" label="Anteckning" multiline />
            <Submit>Spara</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Inkorgen</h2>
            {observations.length === 0 ? (
              <EmptyState>Inga observationer ännu.</EmptyState>
            ) : (
              <ul className="flex flex-col gap-3">
                {observations.map((item) => (
                  <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">
                      {item.sourceSystem} · {item.severity}
                    </p>
                    <p className="mt-2 font-medium">{item.title}</p>
                    {item.body ? <p className="mt-1 text-sm text-ink-soft">{item.body}</p> : null}
                    <p className="mt-2 font-mono text-xs text-faint">{item.createdAt}</p>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
