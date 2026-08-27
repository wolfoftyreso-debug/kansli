import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { eventLine } from "@/lib/platform/event-copy";
import { FAMILY_SYSTEMS } from "@/lib/platform/family";
import { hubStatus, ritaStatusLine } from "@/lib/platform/hub-status";
import { readSession } from "@/lib/auth/session";
import { familyMission, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { listTasks } from "@/lib/kansli/tasks";
import { tryRuntime } from "@/lib/platform/page";
import TaskBoard from "../TaskBoard";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "kansli.metaTitle"),
    description: t(locale, "kansli.metaDescription"),
  };
}

const HREF: Record<string, string> = {
  ekonomi: "/ekonomi",
  tora: "/tora",
  rita: "/rita",
  britt: "/britt",
  irma: "/irma",
  tyra: "/tyra",
  alva: "/alva",
  creditae: "/creditae",
  maj: "/maj",
};

export default async function KansliHub({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const status = hubStatus();
  const highlightId = (await searchParams).task?.trim() || null;
  const events =
    session?.org?.ref && runtime
      ? await runtime.events.list({ orgRef: session.org.ref, limit: 8, order: "desc" })
      : [];
  const tasks = session?.org?.ref && runtime ? await listTasks(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="kansli" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/kansli", label: "Kansli" }]} />
        <h1 className="text-2xl font-semibold tracking-tight">Kansli</h1>
        <p className="text-ink-soft">{t(locale, "kansli.lead")}</p>
      </header>

      {!session ? (
        <SignInGate
          next="/kansli"
          title={t(locale, "kansli.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "kansli.signInBody")}
        </SignInGate>
      ) : (
        <>
          <section className="rounded-xl border border-line bg-surface px-4 py-4">
            <p className="font-medium">{session.name}</p>
            <p className="text-sm text-ink-soft">{session.email}</p>
            {session.org ? (
              <p className="mt-3 text-sm text-muted">
                {session.org.name} · {session.org.roles.join(", ") || "—"} · {session.org.tier}
              </p>
            ) : null}
            <p className="mt-3 font-mono text-xs text-faint">
              Postgres {status.database}
              {" · "}
              Gateway{" "}
              {status.gateway.configured ? status.gateway.auth : t(locale, "common.missing")}
              {" · "}
              {ritaStatusLine(status.rita)}
            </p>
            <p className="mt-3 text-sm">
              <Link
                href="/kansli/beredskap"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                {t(locale, "kansli.firstCustomer")}
              </Link>
              {" · "}
              <Link
                href="/kansli/upphandling"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                {t(locale, "kansli.groupProcurement")}
              </Link>
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">{t(locale, "kansli.family")}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {FAMILY_SYSTEMS.filter(
                (system) => system.id !== "identity" && system.id !== "kansli",
              ).map((system) => (
                <Link
                  key={system.id}
                  href={HREF[system.id] ?? "/platform"}
                  className="rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong"
                >
                  <p className="font-medium">{system.name}</p>
                  <p className="mt-1 text-sm text-ink-soft">{familyMission(locale, system.id)}</p>
                </Link>
              ))}
              <Link
                href="/platform"
                className="rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong"
              >
                <p className="font-medium">{t(locale, "kansli.map")}</p>
                <p className="mt-1 text-sm text-ink-soft">{t(locale, "kansli.mapLead")}</p>
              </Link>
            </div>
          </section>

          {events.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">{t(locale, "kansli.recentEvents")}</h2>
                <Link href="/platform/events" className="text-sm text-ink-soft hover:underline">
                  {t(locale, "common.all")}
                </Link>
              </div>
              <ol className="flex flex-col gap-2">
                {events.map((event) => (
                  <li key={event.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                    <p className="text-sm text-ink">{eventLine(event)}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          <Notice>{t(locale, "kansli.notice")}</Notice>
          <TaskBoard highlightId={highlightId} initialTasks={tasks} locale={locale} />
        </>
      )}
    </AppShell>
  );
}
