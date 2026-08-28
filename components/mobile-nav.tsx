"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { nav } from "@/lib/site";

export function MobileNav() {
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function close() {
      menu.current?.removeAttribute("open");
    }

    function onPointerDown(event: PointerEvent) {
      const element = menu.current;
      if (!element?.open) return;
      if (event.target instanceof Node && !element.contains(event.target)) close();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !menu.current?.open) return;
      close();
      menu.current.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={menu} className="relative site:hidden">
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
            onClick={() => menu.current?.removeAttribute("open")}
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/#contact"
          className="btn btn-teal justify-self-start px-[1.375rem] text-sm"
          onClick={() => menu.current?.removeAttribute("open")}
        >
          Talk to a founder
        </Link>
      </nav>
    </details>
  );
}
