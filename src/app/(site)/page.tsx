import type { Metadata } from "next";
import Link from "next/link";
import { readSession } from "@/lib/auth/session";
import { localeTag, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { LauncherMark } from "@/components/app/LauncherMark";
import { launcherTiles } from "@/lib/platform/launcher";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await readLocale();
  return {
    title: "PIXDRIFT",
    description: t(locale, "home.metaDescription"),
  };
}

export default async function HomePage() {
  const session = await readSession();
  const locale = await readLocale();
  const tiles = launcherTiles(locale);
  const now = new Date();
  const date = new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: "Europe/Stockholm",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat(localeTag(locale), {
    timeZone: "Europe/Stockholm",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const role = session ? t(locale, "home.roleAdmin") : t(locale, "home.roleOpen");

  return (
    <>
      <header className="flex flex-col gap-2">
        <p className="pd-label">
          {date} · {time} · {role}
        </p>
        <h1 className="pd-h1">
          {session?.org?.name
            ? t(locale, "home.helloNamed", { name: session.org.name })
            : t(locale, "home.hello")}
        </h1>
      </header>

      <section className="flex flex-col gap-4">
        <p className="pd-label">{t(locale, "home.programs", { count: tiles.length })}</p>
        <ul className="pd-launch-grid">
          {tiles.map((tile) => (
            <li key={tile.id}>
              <Link href={tile.href} className="pd-launch-tile" title={tile.description}>
                <span className="pd-launch-icon">
                  <LauncherMark id={tile.id} />
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
          {t(locale, "home.openKansli")}
        </Link>
        {" · "}
        <Link href="/documentation" className="underline decoration-line underline-offset-4">
          {t(locale, "home.documentation")}
        </Link>
      </p>
    </>
  );
}
