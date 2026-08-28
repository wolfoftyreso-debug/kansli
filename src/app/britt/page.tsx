import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Field, Notice, SignInGate, Submit } from "@/components/app/SignInGate";
import { observationHref } from "@/lib/britt/links";
import { canRunDemoIntel, listFindings, listRuns, listSnapshots } from "@/lib/britt/intel";
import { listObservations, type Observation } from "@/lib/britt/observations";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { brittObsStatus, brittSource, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import {
  assignObservationToMe,
  closeObservation,
  recordObservation,
  reopenObservation,
  runBrittIntel,
} from "./actions";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "britt.metaTitle"),
    description: t(locale, "britt.metaDescription"),
  };
}

const kr = (value: number) =>
  new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";

export default async function BrittPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; mine?: string }>;
}) {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
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
  const demoIntel = Boolean(orgRef && canRunDemoIntel(orgRef));

  return (
    <AppShell current="britt" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/britt", label: "BRITT" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">BRITT</h1>
        <p className="text-ink-soft">{t(locale, "britt.lead")}</p>
        <Notice>{demoIntel ? t(locale, "britt.noticeDemo") : t(locale, "britt.noticeOwn")}</Notice>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/britt"
          title={t(locale, "britt.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "britt.signInBody")}
        </SignInGate>
      ) : (
        <>
          {demoIntel ? (
            <form action={runBrittIntel} className="rounded-xl border border-line bg-surface p-4">
              <h2 className="text-lg font-semibold">{t(locale, "britt.demoTitle")}</h2>
              <p className="mt-1 text-sm text-ink-soft">{t(locale, "britt.demoBody")}</p>
              {runs[0] ? (
                <p className="mt-1 text-xs text-faint">
                  {t(locale, "britt.demoFindings", { count: runs[0].findingCount })} ·{" "}
                  {formatDateTime(runs[0].createdAt, locale)}
                </p>
              ) : null}
              <div className="mt-3">
                <Submit>{t(locale, "britt.demoRun")}</Submit>
              </div>
            </form>
          ) : null}

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "britt.findings")}</h2>
            {findings.length === 0 ? (
              <EmptyState>
                {demoIntel ? t(locale, "britt.emptyDemo") : t(locale, "britt.emptyOwn")}
              </EmptyState>
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
            <h2 className="text-lg font-semibold">{t(locale, "britt.newObs")}</h2>
            <Field name="title" label={t(locale, "britt.title")} required />
            <Field name="body" label={t(locale, "britt.note")} multiline />
            <Submit>{t(locale, "britt.save")}</Submit>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "britt.inbox")}</h2>
            <p className="flex flex-wrap gap-3 text-sm">
              <Link
                href="/britt?status=open"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "britt.filterOpen")}
              </Link>
              <Link
                href="/britt?status=done"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "britt.filterDone")}
              </Link>
              <Link
                href="/britt?status=all"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "britt.filterAll")}
              </Link>
              <Link
                href="/britt?status=open&mine=1"
                className="underline decoration-line underline-offset-4"
              >
                {t(locale, "britt.filterMine")}
              </Link>
            </p>
            {observations.length === 0 ? (
              <EmptyState>{t(locale, "britt.emptyObs")}</EmptyState>
            ) : (
              groupedObservations(observations).map(([source, items]) => (
                <div key={source} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-ink-soft">
                    {brittSource(locale, source)}
                  </h3>
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
                                {t(locale, "britt.openSource")}
                              </Link>
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs text-faint">
                            {brittObsStatus(locale, item.status)}
                            {item.assigneeRef
                              ? ` · ${t(locale, "britt.assigned")}`
                              : ` · ${t(locale, "britt.unassigned")}`}
                            {" · "}
                            {formatDateTime(item.createdAt, locale)}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.status !== "done" ? (
                              <form action={closeObservation}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>{t(locale, "britt.markDone")}</Submit>
                              </form>
                            ) : (
                              <form action={reopenObservation}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>{t(locale, "britt.reopen")}</Submit>
                              </form>
                            )}
                            {!item.assigneeRef ? (
                              <form action={assignObservationToMe}>
                                <input type="hidden" name="id" value={item.id} />
                                <Submit>{t(locale, "britt.take")}</Submit>
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

          {demoIntel && latest ? (
            <details className="rounded-xl border border-line bg-surface px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">
                {t(locale, "britt.demoFigures", { period: latest.period })}
              </summary>
              <p className="mt-2 text-sm text-ink-soft">{t(locale, "britt.demoSeed")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard label={t(locale, "britt.metric.revenue")} value={kr(latest.revenue)} />
                <MetricCard label={t(locale, "britt.metric.plan")} value={kr(latest.planRevenue)} />
                <MetricCard label={t(locale, "britt.metric.cash")} value={kr(latest.cash)} />
                <MetricCard label={t(locale, "britt.metric.burn")} value={kr(latest.monthlyBurn)} />
                <MetricCard
                  label={t(locale, "britt.metric.top")}
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
