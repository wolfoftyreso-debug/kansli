import type { Metadata } from "next";
import Link from "next/link";
import { readSession } from "@/lib/auth/session";
import { launcherTiles } from "@/lib/platform/launcher";

export const metadata: Metadata = {
  title: "PIXDRIFT",
  description: "Ett rum per jobb. Samma inloggning.",
};

export default async function HomePage() {
  const session = await readSession();
  const tiles = launcherTiles();
  const now = new Date();
  const date = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const role = session ? "Systemadministratör" : "Öppen yta";

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="pd-label">
          {date} · {time} · {role}
        </p>
        <h1 className="pd-h1">{session?.org?.name ? `Hej, ${session.org.name}` : "Hej"}</h1>
      </header>

      <section className="flex flex-col gap-4">
        <p className="pd-label">Program · {tiles.length} installerade</p>
        <ul className="pd-launch-grid">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <Link href={tile.href} className="pd-launch-tile" title={tile.description}>
                <span className="pd-launch-icon" aria-hidden>
                  {tile.mark}
                </span>
                <span className="pd-launch-name">{tile.name}</span>
                <span className="pd-launch-cat">{tile.category}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-ink-soft">
        <Link href="/kansli" className="underline decoration-line underline-offset-4">
          Öppna Kansli
        </Link>
        {" · "}
        <Link href="/documentation" className="underline decoration-line underline-offset-4">
          Dokumentation
        </Link>
      </p>
    </>
  );
}
