import Link from "next/link";
import { demoCompany } from "@pixdrift/tora";
import { readSession } from "@/lib/auth/session";
import { loadToraMarket, parseTier } from "@/lib/tora/market";

export const metadata = {
  title: "TORA — Pixdrift",
  description: "Tender Opportunity and Requirement Analysis.",
};

function sek(value: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(value) + " kr";
}

function field(value: { state: "locked"; teaser: string } | { state: "unlocked"; value: unknown }): string {
  if (value.state === "locked") return value.teaser;
  if (value.value === undefined || value.value === null) return "—";
  return String(value.value);
}

export default async function ToraPage() {
  const session = await readSession();
  const tier = parseTier(session?.org?.tier);
  const market = loadToraMarket(tier);
  const { summary } = market;

  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="pd-label text-faint">
            <Link href="/" className="hover:text-ink">
              PIXDRIFT
            </Link>
            <span aria-hidden> / </span>
            TORA
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">TORA</h1>
          <p className="text-ink-soft">
            Upphandlingsrätt och rekommenderad åtgärd för {demoCompany.name}. Motorn körs
            server-side; det en nivå inte får se når aldrig klienten.
          </p>
          <p className="rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft">
            Demonstrationsdata. Upphandlingarna, beloppen och datumen är påhittade. Nivå:{" "}
            <span className="font-medium text-ink">{tier}</span>
            {session ? ` · ${session.email}` : " · inte inloggad (gratisnivå)"}
          </p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Aktuellt" value={String(summary.openNowCount)} />
          <Stat label="Kommande" value={String(summary.upcomingCount)} />
          <Stat label="Organisationer" value={String(summary.organizationCount)} />
          <Stat label="Publicerat värde" value={sek(summary.knownValueSek)} />
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Aktuellt</h2>
          {market.openNow.length === 0 ? (
            <p className="text-muted">Inga öppna möjligheter i demonstrationsunderlaget.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {market.openNow.map((item) => (
                <li key={item.id} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-accent">{item.verdict}</p>
                    <p className="font-mono text-xs text-faint">{item.scoreBand}</p>
                  </div>
                  <p className="mt-2 font-medium">{field(item.title)}</p>
                  <p className="mt-1 text-sm text-ink-soft">{field(item.organizationName)}</p>
                  <p className="mt-2 text-sm text-muted">{field(item.rationale)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-sm text-faint">
          <Link href="/systems/tora" className="underline decoration-line underline-offset-4 hover:text-ink">
            Produktsida
          </Link>
          {" · "}
          <Link href="/api/tora/market" className="underline decoration-line underline-offset-4 hover:text-ink">
            JSON
          </Link>
          {" · "}
          <Link href="/kansli" className="underline decoration-line underline-offset-4 hover:text-ink">
            Kansli
          </Link>
        </p>
      </main>
    </div>
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
