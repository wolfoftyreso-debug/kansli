import Link from "next/link";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import { AppShell } from "@/components/app/AppShell";
import { readSession } from "@/lib/auth/session";

export const metadata = {
  title: "Plattform — Pixdrift",
  description: "Gemensam infrastruktur: identitet, API-kärna, databaser och synk.",
};

export default async function PlatformPage() {
  const session = await readSession();

  return (
    <AppShell current="platform" session={session}>
      <header className="flex flex-col gap-3">
        <p className="pd-label text-faint">PIXDRIFT / Plattform</p>
        <h1 className="text-3xl font-semibold tracking-tight">En kärna. Egna system.</h1>
        <p className="text-ink-soft">
          Gemensam identitet, gemensamma API:er och en append-only händelselogg. Varje produkt
          äger sitt schema. Ingen produkt skriver i en annans tabeller.
        </p>
      </header>

      <section className="grid gap-3">
        {SYSTEM_MODULES.map((module) => (
          <article key={module.id} className="rounded-xl border border-line bg-surface px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">
                <Link href={module.basePath} className="hover:underline">
                  {module.name}
                </Link>
              </h2>
              <p className="font-mono text-xs text-faint">{module.status}</p>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{module.purpose}</p>
            <p className="mt-2 font-mono text-xs text-muted">
              schema {module.schema ?? "public"} · {module.basePath}
            </p>
          </article>
        ))}
      </section>

      <p className="text-sm text-faint">
        <Link href="/api/platform/health" className="underline decoration-line underline-offset-4">
          /api/platform/health
        </Link>
        {" · "}
        <Link href="/platform/events" className="underline decoration-line underline-offset-4">
          Händelser
        </Link>
      </p>
    </AppShell>
  );
}
