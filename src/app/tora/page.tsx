import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { EmptyState, Field, Notice, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { CompanyBriefingCard } from "@/components/app/CompanyBriefing";
import { buildCompanyBriefing } from "@/lib/tora/briefing";
import { loadToraMarket, resolveViewTier } from "@/lib/tora/market";
import { listSnapshots } from "@/lib/tora/persist";
import { getCompanyProfile, resolveCompany } from "@/lib/tora/profile";
import { sek } from "@/lib/tora/view";
import { publishToraMarket, saveToraProfile } from "./actions";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "tora.metaTitle"),
    description: t(locale, "tora.metaDescription"),
  };
}

export default async function ToraPage() {
  const session = await readSession();
  const locale = await readLocale();
  const runtime = tryRuntime(session?.org?.ref);
  const company = await resolveCompany(runtime?.pool ?? null, session?.org?.ref ?? null);
  const profile =
    session?.org?.ref && runtime ? await getCompanyProfile(runtime.pool, session.org.ref) : null;
  const usingDemoCompany = !profile;
  const tier = resolveViewTier({
    sessionTier: session?.org?.tier,
    usingDemoCompany,
  });
  const market = loadToraMarket(tier, company);
  const briefing = buildCompanyBriefing(company);
  const { summary } = market;
  const snapshots =
    session?.org?.ref && runtime ? await listSnapshots(runtime.pool, session.org.ref) : [];

  return (
    <AppShell current="tora" session={session}>
      <header className="flex flex-col gap-3">
        <ProductCrumb crumbs={[{ href: "/tora", label: "TORA" }]} />
        <h1 className="text-3xl font-semibold tracking-tight">TORA</h1>
        <p className="text-ink-soft">{t(locale, "tora.lead", { name: company.name })}</p>
        <Notice>
          {usingDemoCompany
            ? t(locale, "tora.noticeDemo")
            : t(locale, "tora.noticeSaved", { name: company.name })}
        </Notice>
        <p className="text-sm">
          <Link
            href="/tora/calendar"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            {t(locale, "tora.calendar")}
          </Link>
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t(locale, "tora.current")} value={String(summary.openNowCount)} />
        <Stat label={t(locale, "tora.upcoming")} value={String(summary.upcomingCount)} />
        <Stat label={t(locale, "tora.watch")} value={String(summary.watchCount)} />
        <Stat label={t(locale, "tora.publishedValue")} value={sek(summary.knownValueSek)} />
      </section>

      <CompanyBriefingCard briefing={briefing} />

      {session?.org ? (
        <form
          action={saveToraProfile}
          className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">{t(locale, "tora.yourCompany")}</h2>
          <p className="text-sm text-ink-soft">{t(locale, "tora.profileLead")}</p>
          <Field
            name="name"
            label="Bolagsnamn"
            required
            defaultValue={profile?.name ?? session.org.name}
          />
          <Field
            name="employees"
            label="Anställda"
            defaultValue={
              profile?.employees != null
                ? String(profile.employees)
                : company.employees != null
                  ? String(company.employees)
                  : ""
            }
          />
          <Field
            name="capabilities"
            label="Vad ni kan göra (skriv med komma mellan)"
            defaultValue={(profile?.capabilities ?? company.capabilities).join(", ")}
            placeholder="el.installation, el.service"
          />
          <Field
            name="servesAreas"
            label="Områden ni jobbar i (skriv med komma mellan)"
            defaultValue={(profile?.servesAreas ?? company.servesAreas).join(", ")}
            placeholder="0138, 0182"
          />
          <Field
            name="certifications"
            label="Certifieringar (skriv med komma mellan)"
            defaultValue={(profile?.certifications ?? company.certifications).join(", ")}
          />
          <Field
            name="registrations"
            label="Registreringar (skriv med komma mellan)"
            defaultValue={(profile?.registrations ?? company.registrations).join(", ")}
            placeholder="f_tax, vat"
          />
          {profile ? (
            <p className="text-sm text-ink-soft">
              Sparat:{" "}
              {profile.registrations.length > 0
                ? profile.registrations.join(", ")
                : "inga registreringar"}
            </p>
          ) : null}
          <Submit>Spara bolagsprofil</Submit>
        </form>
      ) : null}

      {session?.org ? (
        <form action={publishToraMarket} className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-lg font-semibold">Dela läget</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Sparar dagens läge så att det syns i BRITT och i händelselistan. Att bara titta här
            delar ingenting.
          </p>
          <div className="mt-3">
            <Submit>Dela läget</Submit>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted">
          <a
            href="/api/auth/login?next=/tora"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            Logga in
          </a>{" "}
          för att kunna dela läget med resten av huset.
        </p>
      )}

      <MarketSection
        title="Aktuellt"
        empty="Inga öppna upphandlingar just nu."
        items={market.openNow}
      />
      <MarketSection title="Kommande" empty="Inga kommande möjligheter." items={market.upcoming} />
      <MarketSection title="Bevakning" empty="Inget att bevaka." items={market.watch} />
      <MarketSection title="Historik" empty="Ingen historik ännu." items={market.history} />

      {session?.org ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Tidigare delningar</h2>
          {snapshots.length === 0 ? (
            <EmptyState>Inget delat ännu.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-2">
              {snapshots.map((item) => (
                <li key={item.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                  <p className="text-sm font-medium">{item.headline}</p>
                  <p className="mt-1 font-mono text-xs text-faint">
                    {item.evaluatedAt} · {item.openNow} öppna · {item.tier}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </AppShell>
  );
}

function MarketSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: Parameters<typeof OpportunityCard>[0]["item"][];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {items.length === 0 ? (
        <EmptyState>{empty}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <OpportunityCard key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <p className="pd-label text-faint">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
