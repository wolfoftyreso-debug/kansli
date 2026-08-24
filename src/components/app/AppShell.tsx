import type { ReactNode } from "react";
import Link from "next/link";
import { SYSTEM_MODULES } from "@pixdrift/systems";
import type { AppSession } from "@/lib/auth/session";

const NAV = [
  ...SYSTEM_MODULES.filter((module) => module.id !== "identity").map((module) => ({
    href: module.basePath,
    label: module.name,
    id: module.id,
  })),
  { href: "/platform", label: "Plattform", id: "platform" },
];

export function AppShell({
  current,
  session,
  children,
}: {
  current: string;
  session: AppSession | null;
  children: ReactNode;
}) {
  return (
    <div className="min-h-full bg-paper text-ink">
      <header className="border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href={session ? "/kansli" : "/"}
              className="shrink-0 text-sm font-semibold tracking-[0.18em]"
            >
              PIXDRIFT
            </Link>
            <nav
              aria-label="Produkter"
              className="hidden flex-wrap items-center gap-x-4 gap-y-1 md:flex"
            >
              {NAV.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={
                    item.id === current
                      ? "text-sm font-medium text-ink"
                      : "text-sm text-ink-soft hover:text-ink"
                  }
                  aria-current={item.id === current ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/platform/events"
                className={
                  current === "events"
                    ? "text-sm font-medium text-ink"
                    : "text-sm text-ink-soft hover:text-ink"
                }
                aria-current={current === "events" ? "page" : undefined}
              >
                Händelser
              </Link>
              <Link
                href="/kansli/upphandling"
                className={
                  current === "upphandling"
                    ? "text-sm font-medium text-ink"
                    : "text-sm text-ink-soft hover:text-ink"
                }
                aria-current={current === "upphandling" ? "page" : undefined}
              >
                Upphandling
              </Link>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {session ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">{session.email}</span>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="text-sm text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
                  >
                    Logga ut
                  </button>
                </form>
              </>
            ) : (
              <a
                href={`/api/auth/login?next=${encodeURIComponent(loginNext(current))}`}
                className="text-sm font-medium text-ink underline decoration-line underline-offset-4"
              >
                Logga in
              </a>
            )}
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none text-sm text-ink [&::-webkit-details-marker]:hidden">
                <span className="pd-label">Meny</span>
              </summary>
              <nav
                aria-label="Produkter, mobil"
                className="absolute right-0 top-full z-10 mt-2 w-52 border border-line bg-surface p-2 shadow-sm"
              >
                {NAV.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/platform/events"
                  className="block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                >
                  Händelser
                </Link>
                <Link
                  href="/kansli/upphandling"
                  className="block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                >
                  Upphandling
                </Link>
              </nav>
            </details>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12">{children}</main>
    </div>
  );
}

function loginNext(current: string): string {
  if (current === "events") return "/platform/events";
  const match = NAV.find((item) => item.id === current);
  return match?.href ?? "/kansli";
}
