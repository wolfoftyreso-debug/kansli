import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { observationHref, sourceLabel } from "@/lib/britt/links";
import { listFindings, listRuns, listSnapshots } from "@/lib/britt/intel";
import { listObservations, type Observation } from "@/lib/britt/observations";
import { readSession } from "@/lib/auth/session";
import { formatSwedishDateTime } from "@/lib/format/datetime";
import { tryRuntime } from "@/lib/platform/page";
import {
  assignObservationToMe,
  closeObservation,
  recordObservation,
  reopenObservation,
  runBrittIntel,
} from "./actions";

export const metadata = {
  title: "BRITT — Pixdrift",
  description: "Det som hänt och behöver följas upp.",
};

const kr = (value: number) =>
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";

export default async function BrittPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mine?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const orgRef = session?.org?.ref;
  const params = await searchParams;
  const status =
    params.status === "done" || params.status === "all" || params.status === "open"
      ? params.status
      : "open";
  const mine = params.mine === "1";
  const observations =
    orgRef && runtime
      ? await listObservations(runtime.pool, orgRef, {
          status,
          assigneeRef: mine ? session.sub : null,
        })
      : [];
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
          BRITT samlar sådant som behöver följas upp. Siffrorna här är exempel — inga kopplingar
          till Fortnox eller Revolut än.
        </p>
        <Notice>
          Siffrorna gäller exempelbolaget, inte er riktiga bokföring. Viktiga fynd dyker upp som
          observationer i inkorgen.
        </Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/britt" title="Logga in för att se observationer">
          Observationer tillhör ert företag. Det som händer i TORA, RITA och IRMA dyker upp här.
        </SignInGate>
      ) : (
        <>
          <form action={runBrittIntel} className="rounded-xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">Demonstrationsanalys</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Jämför omsättning mot plan, kollar kassan och hur beroende ni är av er största kund —
              med exempelsiffror.
            </p>
            {runs[0] ? (
              <p className="mt-1 text-xs text-faint">
                {runs[0].findingCount} fynd · {formatSwedishDateTime(runs[0].createdAt)}
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

          <form
            action={recordObservation}
            className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
          >
            <h2 className="text-lg font-semibold">Ny observation</h2>
            <Field name="title" label="Rubrik" required />
            <Field name="body" label="Anteckning" multiline />
            <Submit>Spara</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Inkorgen</h2>
            <p className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/britt?status=open"
                className="underline decoration-line underline-offset-4"
              >
                Öppna
              </Link>
              <Link
                href="/britt?status=done"
                className="underline decoration-line underline-offset-4"
              >
                Klara
              </Link>
              <Link
                href="/britt?status=all"
                className="underline decoration-line underline-offset-4"
              >
                Alla
              </Link>
              <Link
                href="/britt?status=open&mine=1"
                className="underline decoration-line underline-offset-4"
              >
                Mina
              </Link>
            </p>
            {observations.length === 0 ? (
              <EmptyState>Inga observationer i den här vyn.</EmptyState>
            ) : (
              groupedObservations(observations).map(([source, items]) => (
                <div key={source} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-ink-soft">{sourceLabel(source)}</h3>
                  <ul className="flex flex-col gap-3">
                    {items.map((item) => {
                      const href = observationHref(item.subjectRef);
                      return (
                        <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-accent">
                            {item.sourceSystem} · {item.severity}
                          </p>
                          <p className="mt-2 font-medium">{item.title}</p>
                          {item.body ? (
                            <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
                          ) : null}
                          {href ? (
                            <p className="mt-2 text-sm">
                              <Link
                                href={href}
                                className="underline decoration-line underline-offset-4"
                              >
                                Öppna källan
                              </Link>
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-faint">
                            {item.status}
                            {item.assigneeRef ? " · tilldelad" : " · ingen ansvarig"}
                            {" · "}
                            {formatSwedishDateTime(item.createdAt)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.status !== "done" ? (
                              <form action={closeObservation}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>Markera klar</Submit>
                              </form>
                            ) : (
                              <form action={reopenObservation}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>Återöppna</Submit>
                              </form>
                            )}
                            {!item.assigneeRef ? (
                              <form action={assignObservationToMe}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>Ta den</Submit>
                              </form>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>

          {latest ? (
            <details className="rounded-xl border border-line bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                Visa demonstrationssiffror · {latest.period}
              </summary>
              <p className="mt-2 text-sm text-ink-soft">
                Seed för Exempelbolaget. Inte Fortnox. Inte livekassa.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label="Omsättning" value={kr(latest.revenue)} />
                <MetricCard label="Plan" value={kr(latest.planRevenue)} />
                <MetricCard label="Kassa" value={kr(latest.cash)} />
                <MetricCard label="Utgifter per månad" value={kr(latest.monthlyBurn)} />
                <MetricCard
                  label="Största kund"
                  value={`${Math.round(latest.topCustomerShare * 100)} %`}
                />
              </div>
            </details>
          ) : null}
        </>
      )}
    </AppShell>
  );
}

function groupedObservations(items: Observation[]): Array<[string, Observation[]]> {
  const groups = new Map<string, Observation[]>();
  for (const item of items) {
    const list = groups.get(item.sourceSystem) ?? [];
    list.push(item);
    groups.set(item.sourceSystem, list);
  }
  return [...groups.entries()];
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
