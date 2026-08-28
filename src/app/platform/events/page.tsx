import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice, SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format/datetime";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { eventHeadline } from "@/lib/platform/event-copy";
import { tryRuntime } from "@/lib/platform/page";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "events.metaTitle"),
    description: t(locale, "events.metaDescription"),
  };
}

export default async function EventsPage() {
  const session = await readSession();
  const locale = await readLocale();
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
            { href: "/platform", label: t(locale, "service.platform") },
            { href: "/platform/events", label: t(locale, "service.events") },
          ]}
        />
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "events.heading")}</h1>
        <p className="text-ink-soft">{t(locale, "events.lead")}</p>
        <Notice>{t(locale, "events.notice")}</Notice>
      </header>

      {!session?.org ? (
        <SignInGate
          next="/platform/events"
          title={t(locale, "events.signInTitle")}
          actionLabel={t(locale, "chrome.signIn")}
        >
          {t(locale, "events.signInBody")}
        </SignInGate>
      ) : events.length === 0 ? (
        <EmptyState>{t(locale, "events.empty")}</EmptyState>
      ) : (
        <ol className="flex flex-col gap-2">
          {events.map((event) => {
            const headline = eventHeadline(event.payload);
            return (
              <li key={event.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-mono text-xs text-accent">{event.kind}</p>
                  <p className="font-mono text-xs text-faint">
                    {formatDateTime(event.occurredAt, locale)}
                  </p>
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
