import Link from "next/link";
import { AppShell } from "@/components/app/AppShell";
import { OpportunityCard } from "@/components/app/OpportunityCard";
import { EmptyState, Field, Notice, Submit } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { tryRuntime } from "@/lib/platform/page";
import { loadToraMarket, parseTier } from "@/lib/tora/market";
import { listSnapshots } from "@/lib/tora/persist";
import { getCompanyProfile, resolveCompany } from "@/lib/tora/profile";
import { sek } from "@/lib/tora/view";
import { publishToraMarket, saveToraProfile } from "./actions";

export const metadata = {
  title: "TORA — Pixdrift",
  description: "Tender Opportunity and Requirement Analysis.",
};

export default async function ToraPage() {
  const session = await readSession();
  const tier = parseTier(session?.org?.tier);
  const runtime = tryRuntime();
  const company = await resolveCompany(runtime?.pool ?? null, session?.org?.ref ?? null);
  const profile =
    session?.org?.ref && runtime ? await getCompanyProfile(runtime.pool, session.org.ref) : null;
  const market = loadToraMarket(tier, company);
  const { summary } = market;
  const snapshots =
    session?.org?.ref && runtime ? await listSnapshots(runtime.pool, session.org.ref) : [];
  const usingDemoCompany = !profile;

  return (
    <AppShell current="tora" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / TORA</p>
        <h1 className="text-3xl font-semibold tracking-tight">TORA</h1>
        <p className="text-ink-soft">
          Upphandlingsrätt och rekommenderad åtgärd för {company.name}. Motorn körs server-side; det
          en nivå inte får se når aldrig klienten. Inte RITA.
        </p>
        <Notice>
          Upphandlingarna i underlaget är demonstrationsdata. Bolagsfakta är{" "}
          {usingDemoCompany
            ? "fortfarande demonstrationsbolaget — spara er profil nedan."
            : `er sparade profil (${company.name}).`}{" "}
          Nivå: <span className="font-medium text-ink">{tier}</span>
          {session ? ` · ${session.email}` : " · inte inloggad (gratisnivå)"}
        </Notice>
        <p className="text-sm">
          <Link
            href="/tora/calendar"
            className="underline decoration-line underline-offset-4 hover:text-ink"
          >
            Kalender
          </Link>
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Aktuellt" value={String(summary.openNowCount)} />
        <Stat label="Kommande" value={String(summary.upcomingCount)} />
        <Stat label="Bevakning" value={String(summary.watchCount)} />
        <Stat label="Publicerat värde" value={sek(summary.knownValueSek)} />
      </section>

      {session?.org ? (
        <form
          action={saveToraProfile}
          className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4"
        >
          <h2 className="text-lg font-semibold">Ert bolag i motorn</h2>
          <p className="text-sm text-ink-soft">
            Utan profil utvärderas Exempelbolaget. Marknadsnotiserna är fortfarande demo.
          </p>
          <Field
            name="name"
            label="Bolagsnamn"
            required
            defaultValue={profile?.name ?? session.org.name}
          />
          <Field
            name="employees"
            label="Anställda"
            defaultValue={profile?.employees != null ? String(profile.employees) : ""}
          />
          <Field
            name="capabilities"
            label="Förmågor (kommaseparerade)"
            defaultValue={(profile?.capabilities ?? []).join(", ")}
            placeholder="el.installation, el.service"
          />
          <Field
            name="servesAreas"
            label="Områdeskoder (kommaseparerade)"
            defaultValue={(profile?.servesAreas ?? []).join(", ")}
            placeholder="0138, 0182"
          />
          <Field
            name="certifications"
            label="Certifieringar (kommaseparerade)"
            defaultValue={(profile?.certifications ?? []).join(", ")}
          />
          <Field
            name="registrations"
            label="Registreringar (kommaseparerade)"
            defaultValue={(profile?.registrations ?? []).join(", ")}
            placeholder="f_tax, vat"
          />
          <Submit>Spara bolagsprofil</Submit>
        </form>
      ) : null}

      {session?.org ? (
        <form action={publishToraMarket} className="rounded-xl border border-line bg-surface p-4">
          <h2 className="text-lg font-semibold">Publicera till familjen</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Skriver en ögonblicksbild i TORA:s schema och en händelse. BRITT lyssnar. Att läsa
            marknaden publicerar ingenting.
          </p>
          <div className="mt-3">
            <Submit>Publicera utvärdering</Submit>
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
          för att publicera utvärderingen till BRITT och händelseloggen.
        </p>
      )}

      <MarketSection
        title="Aktuellt"
        empty="Inga öppna möjligheter i demonstrationsunderlaget."
        items={market.openNow}
      />
      <MarketSection title="Kommande" empty="Inga kommande möjligheter." items={market.upcoming} />
      <MarketSection title="Bevakning" empty="Inget att bevaka." items={market.watch} />
      <MarketSection title="Historik" empty="Ingen historik i underlaget." items={market.history} />

      {session?.org ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Publicerade ögonblicksbilder</h2>
          {snapshots.length === 0 ? (
            <EmptyState>Inget publicerat ännu.</EmptyState>
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
