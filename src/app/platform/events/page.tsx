import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";

export const metadata = {
  title: "Händelser — Pixdrift",
  description: "Append-only synk- och revisionslogg för den aktiva organisationen.",
};

export default async function EventsPage() {
  const session = await readSession();
  const runtime = tryRuntime();
  const events =
    session?.org?.ref && runtime
      ? await runtime.events.list({ orgRef: session.org.ref, limit: 50, order: "desc" })
      : [];

  return (
    <AppShell current="events" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / Händelser</p>
        <h1 className="text-3xl font-semibold tracking-tight">Händelselogg</h1>
        <p className="text-ink-soft">
          Append-only. Produkter synkar genom att publicera och lyssna — de läser inte varandras
          tabeller.
        </p>
        <Notice>Visas för den aktiva organisationen i sessionen. Ändras inte i efterhand.</Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/platform/events" title="Logga in för att läsa loggen">
          Händelser är scoped till organisationen. Utan session är listan tom avsiktligt.
        </SignInGate>
      ) : events.length === 0 ? (
        <EmptyState>Inga händelser ännu. Publicera från TORA eller skapa något i RITA.</EmptyState>
      ) : (
        <ol className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-mono text-xs text-accent">{event.kind}</p>
                <p className="font-mono text-xs text-faint">{event.occurredAt}</p>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {event.system}
                {event.subjectRef ? ` · ${event.subjectRef}` : ""}
              </p>
            </li>
          ))}
        </ol>
      )}
    </AppShell>
  );
}
