import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { eventHeadline } from "@/lib/platform/event-copy";
import { tryRuntime } from "@/lib/platform/page";

export const metadata = {
  title: "Händelser — Pixdrift",
  description: "Allt som hänt i era system, i tidsordning.",
};

export default async function EventsPage() {
  const session = await readSession();
  const runtime = tryRuntime(session?.org?.ref);
  const events =
    session?.org?.ref && runtime
      ? await runtime.events.list({ orgRef: session.org.ref, limit: 50, order: "desc" })
      : [];

  return (
    <AppShell current="events" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb
          crumbs={[
            { href: "/platform", label: "Plattform" },
            { href: "/platform/events", label: "Händelser" },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">Händelselogg</h1>
        <p className="text-ink-soft">
          Listan fylls bara på — inget ändras eller tas bort i efterhand.
        </p>
        <Notice>Du ser händelser för det företag du är inloggad som.</Notice>
      </header>

      {!session?.org ? (
        <SignInGate next="/platform/events" title="Logga in för att läsa loggen">
          Händelserna tillhör ert företag. Logga in för att se dem.
        </SignInGate>
      ) : events.length === 0 ? (
        <EmptyState>Inga händelser ännu. De dyker upp när ni börjar använda systemen.</EmptyState>
      ) : (
        <ol className="flex flex-col gap-2">
          {events.map((event) => {
            const headline = eventHeadline(event.payload);
            return (
              <li key={event.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-xs text-accent">{event.kind}</p>
                  <p className="font-mono text-xs text-faint">{event.occurredAt}</p>
                </div>
                {headline ? <p className="mt-1 text-sm text-ink">{headline}</p> : null}
                <p className="mt-1 text-sm text-ink-soft">
                  {event.system}
                  {event.subjectRef ? ` · ${event.subjectRef}` : ""}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </AppShell>
  );
}
