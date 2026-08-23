import Link from "next/link";
import { SYSTEM_MODULES } from "@pixdrift/systems";

export const metadata = {
  title: "Plattform — Pixdrift",
  description: "Gemensam infrastruktur: identitet, API-kärna, databaser och synk.",
};

export default function PlatformPage() {
  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-16">
        <header className="flex flex-col gap-3">
          <p className="pd-label text-faint">
            <Link href="/" className="hover:text-ink">
              PIXDRIFT
            </Link>
            <span aria-hidden> / </span>
            Plattform
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">En kärna. Egna system.</h1>
          <p className="text-ink-soft">
            Gemensam identitet, gemensamma API:er och en append-only händelselogg. Varje
            produkt äger sitt schema. Ingen produkt skriver i en annans tabeller.
          </p>
        </header>

        <section className="grid gap-3">
          {SYSTEM_MODULES.map((module) => (
            <article key={module.id} className="rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold">{module.name}</h2>
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
          <Link href="/api/platform/systems" className="underline decoration-line underline-offset-4">
            /api/platform/systems
          </Link>
          {" · "}
          <Link href="/tora" className="underline decoration-line underline-offset-4">
            TORA
          </Link>
          {" · "}
          <Link href="/kansli" className="underline decoration-line underline-offset-4">
            Kansli
          </Link>
        </p>
      </main>
    </div>
  );
}
