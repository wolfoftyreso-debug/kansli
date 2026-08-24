import Link from "next/link";
import type { CalendarEntryView } from "@pixdrift/tora";
import { AppShell } from "@/components/app/AppShell";
import { EmptyState, Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { loadToraCalendar, parseTier } from "@/lib/tora/market";
import { resolveCompany } from "@/lib/tora/profile";
import { opportunityHref } from "@/lib/tora/view";

export const metadata = {
  title: "Kalender — TORA — Pixdrift",
};

const KIND_LABEL: Record<CalendarEntryView["kind"], string> = {
  deadline: "Sista anbudsdag",
  admission_deadline: "Sista dag att anmäla sig",
  expected_announcement: "Förväntad annons",
  contract_end: "Avtalsslut",
  action: "Åtgärd",
};

export default async function ToraCalendarPage() {
  const session = await readSession();
  const tier = parseTier(session?.org?.tier);
  const runtime = tryRuntime();
  const company = await resolveCompany(runtime?.pool ?? null, session?.org?.ref ?? null);
  const calendar = loadToraCalendar(tier, company);

  return (
    <AppShell current="tora" session={session}>
      <p className="pd-label text-faint">
        <Link href="/tora" className="hover:text-ink">
          PIXDRIFT / TORA
        </Link>
      </p>
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Kalender</h1>
        <p className="text-ink-soft">
          Framåtblickande datum från samma motor som marknaden. Gratisnivån ser formen, inte
          köparen.
        </p>
        <Notice>
          {calendar.alertCount} aviseringar.{" "}
          {calendar.alerts.state === "locked" ? calendar.alerts.teaser : "Innehållet följer nivån."}
        </Notice>
      </header>

      <Bucket title="Den här veckan" entries={calendar.thisWeek} />
      <Bucket title="30 dagar" entries={calendar.next30Days} />
      <Bucket title="90 dagar" entries={calendar.next90Days} />
      <Bucket title="12 månader" entries={calendar.next12Months} />

      {calendar.alerts.state === "unlocked" && calendar.alerts.value.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Aviseringar</h2>
          <ul className="flex flex-col gap-2">
            {calendar.alerts.value.map((alert) => (
              <li key={alert.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className="font-medium">{alert.title}</p>
                <p className="mt-1 text-sm text-ink-soft">{alert.body}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppShell>
  );
}

function Bucket({ title, entries }: { title: string; entries: CalendarEntryView[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {entries.length === 0 ? (
        <EmptyState>Inget i det här fönstret.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={`${entry.date}-${entry.kind}-${entry.opportunityId ?? entry.title}`}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {KIND_LABEL[entry.kind]}
                {entry.predicted ? " · prognos" : ""}
              </p>
              <p className="mt-1 font-medium">
                {entry.identified && entry.opportunityId ? (
                  <Link
                    href={opportunityHref({ id: entry.opportunityId })}
                    className="hover:underline"
                  >
                    {entry.title || "Möjlighet"}
                  </Link>
                ) : (
                  entry.title || "Låst titel"
                )}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{entry.detail}</p>
              <p className="mt-1 font-mono text-xs text-faint">
                {entry.date} · {entry.daysAway} dagar
                {entry.organizationName ? ` · ${entry.organizationName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
