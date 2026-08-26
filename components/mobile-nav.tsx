"use client";

import Link from "next/link";
import { nav } from "@/lib/site";

function closeMenu(event: { currentTarget: HTMLElement }) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function MobileNav() {
  return (
    <details className="relative site:hidden">
      <summary className="btn btn-secondary min-h-11 min-w-11 cursor-pointer list-none px-3 text-sm">
        Menu
      </summary>
      <nav
        className="absolute top-[calc(100%+0.75rem)] right-0 z-50 grid min-w-[16rem] gap-4 border border-line bg-white px-5 py-5 shadow-[0_12px_40px_rgb(0_0_40/0.08)]"
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
          className="btn btn-teal justify-self-start px-[1.375rem] text-sm"
          onClick={closeMenu}
        >
          Talk to a founder
        </Link>
      </nav>
    </details>
  );
}
