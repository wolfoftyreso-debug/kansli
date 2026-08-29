import Link from "next/link";
import type { CalendarEntryView } from "@pixdrift/tora";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { EmptyState, Notice } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t, toraCalKind, type Locale } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { tryRuntime } from "@/lib/platform/page";
import { loadToraCalendar, resolveViewTier } from "@/lib/tora/market";
import { resolveCompany } from "@/lib/tora/profile";
import { opportunityHref } from "@/lib/tora/view";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tora.cal.metaTitle"),
    description: t(locale, "tora.metaDescription"),
  };
}

export default async function ToraCalendarPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const company = await resolveCompany(runtime?.pool ?? null, session?.org?.ref ?? null);
  const tier = resolveViewTier({
    sessionTier: session?.org?.tier,
    usingDemoCompany: company.id === "comp:tyresoel",
  });
  const calendar = loadToraCalendar(tier, company);

  return (
    <AppShell current="tora" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/tora", label: "TORA" },
          { href: "/tora/calendar", label: t(locale, "tora.cal.heading") },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{t(locale, "tora.cal.heading")}</h1>
        <p className="text-ink-soft">{t(locale, "tora.cal.lead", { name: company.name })}</p>
        <Notice>
          {t(locale, "tora.cal.alertCount", { count: calendar.alertCount })}{" "}
          {calendar.alerts.state === "locked"
            ? calendar.alerts.teaser
            : t(locale, "tora.cal.alertUnlocked")}
        </Notice>
        {calendar.thisWeek.length +
          calendar.next30Days.length +
          calendar.next90Days.length +
          calendar.next12Months.length ===
        0 ? (
          <Notice>{t(locale, "tora.cal.emptyPeriod")}</Notice>
        ) : null}
      </header>

      <Bucket title={t(locale, "tora.cal.thisWeek")} entries={calendar.thisWeek} locale={locale} />
      <Bucket title={t(locale, "tora.cal.days30")} entries={calendar.next30Days} locale={locale} />
      <Bucket title={t(locale, "tora.cal.days90")} entries={calendar.next90Days} locale={locale} />
      <Bucket
        title={t(locale, "tora.cal.months12")}
        entries={calendar.next12Months}
        locale={locale}
      />

      {calendar.alerts.state === "unlocked" && calendar.alerts.value.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">{t(locale, "tora.cal.reminders")}</h2>
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

function Bucket({
  title,
  entries,
  locale,
}: {
  title: string;
  entries: CalendarEntryView[];
  locale: Locale;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {entries.length === 0 ? (
        <EmptyState>{t(locale, "tora.cal.emptyBucket")}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li
              key={`${entry.date}-${entry.kind}-${entry.opportunityId ?? entry.title}`}
              className="rounded-xl border border-line bg-surface px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-accent">
                {toraCalKind(locale, entry.kind)}
                {entry.predicted ? ` · ${t(locale, "tora.cal.forecast")}` : ""}
              </p>
              <p className="mt-1 font-medium">
                {entry.identified && entry.opportunityId ? (
                  <Link
                    href={opportunityHref({ id: entry.opportunityId })}
                    className="hover:underline"
                  >
                    {entry.title || t(locale, "tora.cal.opportunity")}
                  </Link>
                ) : (
                  entry.title || t(locale, "tora.cal.lockedTitle")
                )}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{entry.detail}</p>
              <p className="mt-1 font-mono text-xs text-faint">
                {entry.date} · {t(locale, "tora.cal.daysAway", { days: entry.daysAway })}
                {entry.organizationName ? ` · ${entry.organizationName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
