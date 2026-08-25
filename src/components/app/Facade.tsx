"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppSession } from "@/lib/auth/session";
import {
  FACADE_PRODUCTS,
  FACADE_SERVICE,
  activeFacadeHref,
  loginNextFromPath,
} from "@/lib/platform/facade";

function RailLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "border-l-2 border-ink bg-ink px-3 py-1.5 text-sm font-medium text-paper"
          : "border-l-2 border-transparent px-3 py-1.5 text-sm text-ink-soft hover:bg-paper hover:text-ink"
      }
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function Facade({
  session,
  runtime,
  children,
}: {
  session: AppSession | null;
  runtime: "produktion" | "förhandsvisning" | "lokal";
  children: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const hrefs = [...FACADE_PRODUCTS, ...FACADE_SERVICE].map((item) => item.href);
  const active = activeFacadeHref(pathname, hrefs);
  const room =
    [...FACADE_PRODUCTS, ...FACADE_SERVICE].find((item) => item.href === active)?.label ??
    "PIXDRIFT";
  const loginHref = `/api/auth/login?next=${encodeURIComponent(loginNextFromPath(pathname))}`;

  return (
    <div className="pd-facade flex min-h-full bg-paper text-ink">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <Link
          href={session ? "/kansli" : "/"}
          className="border-b border-line px-3 py-2 text-xs font-semibold tracking-[0.18em]"
        >
          PIXDRIFT
        </Link>
        <nav aria-label="Rum" className="flex flex-col py-2">
          {FACADE_PRODUCTS.map((item) => (
            <RailLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active === item.href}
            />
          ))}
        </nav>
        <nav aria-label="Tjänster" className="mt-auto flex flex-col border-t border-line py-2">
          {FACADE_SERVICE.map((item) => (
            <RailLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active === item.href}
            />
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-9 items-center justify-between gap-3 border-b border-line bg-surface px-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={session ? "/kansli" : "/"}
              className="text-xs font-semibold tracking-[0.18em] md:hidden"
            >
              PIXDRIFT
            </Link>
            <p className="pd-label truncate">{room}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <p className="pd-label hidden sm:block">
              {session?.org?.name ?? (session ? session.email : "inte inloggad")}
              {" · "}
              {runtime}
            </p>
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button type="submit" className="pd-label hover:text-ink">
                  Logga ut
                </button>
              </form>
            ) : (
              <a href={loginHref} className="pd-label hover:text-ink">
                Logga in
              </a>
            )}
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none pd-label [&::-webkit-details-marker]:hidden">
                Meny
              </summary>
              <nav
                aria-label="Rum, mobil"
                className="absolute right-0 top-full z-20 mt-1 w-52 border border-line bg-surface"
              >
                {[...FACADE_PRODUCTS, ...FACADE_SERVICE].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </details>
          </div>
        </header>
        <main
          id="main"
          className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-5 md:px-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
