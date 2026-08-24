import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { Notice, SignInGate } from "@/components/app/SignInGate";
import { eventLine } from "@/lib/platform/event-copy";
import { FAMILY_SYSTEMS } from "@/lib/platform/family";
import { hubStatus, ritaStatusLine } from "@/lib/platform/hub-status";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import TaskBoard from "../TaskBoard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kansli — Pixdrift",
  description: "Navet: identitet, uppgifter och ingång till familjen.",
};

const HREF: Record<string, string> = {
  tora: "/tora",
  rita: "/rita",
  britt: "/britt",
  irma: "/irma",
  tyra: "/tyra",
  alva: "/alva",
};

export default async function KansliHub({
  searchParams,
}: {
  searchParams: Promise<{ task?: string }>;
}) {
  const session = await readSession();
  const runtime = tryRuntime();
  const status = hubStatus();
  const highlightId = (await searchParams).task?.trim() || null;
  const events =
    session?.org?.ref && runtime
      ? await runtime.events.list({ orgRef: session.org.ref, limit: 8, order: "desc" })
      : [];

  return (
    <AppShell current="kansli" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / Kansli</p>
        <h1 className="text-3xl font-semibold tracking-tight">Kansli</h1>
        <p className="text-ink-soft">
          Navet. Samma identitet i alla system. Uppgiftstavlan är kansliets egen data — inte TORA,
          inte RITA.
        </p>
      </header>

      {!session ? (
        <SignInGate next="/kansli" title="Logga in med Pixdrift">
          Samma inloggning gäller TORA, RITA, BRITT, IRMA och ALVA.
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
              Gateway {status.gateway.configured ? status.gateway.auth : "saknas"}
              {" · "}
              {ritaStatusLine(status.rita)}
            </p>
            <p className="mt-3 text-sm">
              <Link
                href="/kansli/beredskap"
                className="underline decoration-line underline-offset-4 hover:text-ink"
              >
                Första kunden — grindar, inte datum
              </Link>
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Familjen</h2>
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
                  <p className="mt-1 text-sm text-ink-soft">{system.question}</p>
                </Link>
              ))}
              <Link
                href="/platform"
                className="rounded-xl border border-line bg-surface px-4 py-3 hover:border-line-strong"
              >
                <p className="font-medium">Kartan</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Vad varje system gör, och hur de hänger ihop.
                </p>
              </Link>
            </div>
          </section>

          {events.length > 0 ? (
            <section className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold">Senaste händelser</h2>
                <Link href="/platform/events" className="text-sm text-ink-soft hover:underline">
                  Alla
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

          <Notice>
            När en uppgift skapas får BRITT en observation. Det är samma hus, två pärmar.
          </Notice>
          <TaskBoard highlightId={highlightId} />
        </>
      )}
    </AppShell>
  );
}
