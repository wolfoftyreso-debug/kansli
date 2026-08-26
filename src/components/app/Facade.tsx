"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppSession } from "@/lib/auth/session";
import { DEFAULT_LOCALE, t, type Locale, type MessageKey } from "@/lib/i18n";
import {
  FACADE_PRODUCTS,
  FACADE_SERVICE,
  activeFacadeHref,
  loginNextFromPath,
  orgIdFromRef,
  type FacadeRuntime,
} from "@/lib/platform/facade";
import { LocalePicker } from "./LocalePicker";

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

const RUNTIME_KEY: Record<FacadeRuntime, MessageKey> = {
  production: "runtime.production",
  preview: "runtime.preview",
  local: "runtime.local",
};

export function Facade({
  session,
  runtime,
  locale = DEFAULT_LOCALE,
  children,
}: {
  session: AppSession | null;
  runtime: FacadeRuntime;
  locale?: Locale;
  children: ReactNode;
}) {
  const pathname = usePathname() || "/";
  const hrefs = [...FACADE_PRODUCTS, ...FACADE_SERVICE].map((item) => item.href);
  const active = activeFacadeHref(pathname, hrefs);
  const roomItem = [...FACADE_PRODUCTS, ...FACADE_SERVICE].find((item) => item.href === active);
  const room = roomItem
    ? roomItem.id === roomItem.label
      ? roomItem.label
      : t(locale, roomItem.label as MessageKey)
    : "PIXDRIFT";
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
        <nav aria-label={t(locale, "chrome.rooms")} className="flex flex-col py-2">
          {FACADE_PRODUCTS.map((item) => (
            <RailLink
              key={item.id}
              href={item.href}
              label={item.label}
              active={active === item.href}
            />
          ))}
        </nav>
        <nav
          aria-label={t(locale, "chrome.services")}
          className="mt-auto flex flex-col border-t border-line py-2"
        >
          {FACADE_SERVICE.map((item) => (
            <RailLink
              key={item.id}
              href={item.href}
              label={t(locale, item.label as MessageKey)}
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
              {session?.org?.name ?? (session ? session.email : t(locale, "chrome.signedOut"))}
              {" · "}
              {t(locale, RUNTIME_KEY[runtime])}
            </p>
            {session && session.memberships.length > 1 ? (
              <details className="relative">
                <summary className="cursor-pointer list-none pd-label hover:text-ink [&::-webkit-details-marker]:hidden">
                  {t(locale, "chrome.switchOrg")}
                </summary>
                <nav
                  aria-label={t(locale, "chrome.orgs")}
                  className="absolute right-0 top-full z-20 mt-1 w-56 border border-line bg-surface"
                >
                  {session.memberships.map((membership) => {
                    const orgId = orgIdFromRef(membership.ref);
                    if (!orgId) return null;
                    const href = `/api/auth/login?org=${encodeURIComponent(orgId)}&next=${encodeURIComponent(loginNextFromPath(pathname))}`;
                    const current = session.org?.ref === membership.ref;
                    return (
                      <a
                        key={membership.ref}
                        href={href}
                        className={
                          current
                            ? "block px-3 py-2 text-sm font-medium text-ink"
                            : "block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                        }
                        aria-current={current ? "true" : undefined}
                      >
                        {membership.name}
                      </a>
                    );
                  })}
                </nav>
              </details>
            ) : null}
            <LocalePicker locale={locale} next={pathname} label={t(locale, "chrome.language")} />
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="pd-label underline underline-offset-4 hover:text-ink"
                >
                  {t(locale, "chrome.signOut")}
                </button>
              </form>
            ) : (
              <a href={loginHref} className="pd-label underline underline-offset-4 hover:text-ink">
                {t(locale, "chrome.signIn")}
              </a>
            )}
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none pd-label [&::-webkit-details-marker]:hidden">
                {t(locale, "chrome.menu")}
              </summary>
              <nav
                aria-label={t(locale, "chrome.roomsMobile")}
                className="absolute right-0 top-full z-20 mt-1 w-52 border border-line bg-surface"
              >
                {[...FACADE_PRODUCTS, ...FACADE_SERVICE].map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="block px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                  >
                    {item.id === item.label ? item.label : t(locale, item.label as MessageKey)}
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
