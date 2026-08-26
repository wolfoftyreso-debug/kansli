"use client";

import Link from "next/link";
import { nav } from "@/lib/site";

function closeMenu(event: { currentTarget: HTMLElement }) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function MobileNav() {
  return (
    <details className="site:hidden">
      <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center border border-navy px-3 text-sm font-semibold text-navy">
        Menu
      </summary>
      <nav
        className="absolute inset-x-0 top-[76px] grid gap-4 border-b border-t border-line bg-white px-6 py-5"
        aria-label="Primary"
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-base font-medium text-ink"
            onClick={closeMenu}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/#contact"
          className="min-h-11 justify-self-start bg-teal px-[22px] py-[11px] text-sm font-semibold text-white hover:text-white"
          onClick={closeMenu}
        >
          Talk to a founder
        </Link>
      </nav>
    </details>
  );
}
