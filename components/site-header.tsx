import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { nav } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-[10px]">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-8 px-6 site:px-10">
        <Link href="/" className="flex items-baseline gap-3 text-ink hover:text-ink">
          <span className="text-[22px] font-bold tracking-[-0.02em]">Landvex</span>
          <span className="hidden h-[18px] w-px bg-edge min-[520px]:inline-block" />
          <span className="eyebrow hidden text-subtle min-[520px]:inline">
            Stockholm · Houston
          </span>
        </Link>

        <nav className="hidden items-center gap-[34px] site:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink hover:text-teal"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/#contact"
            className="min-h-11 bg-teal px-[22px] py-[11px] text-sm font-semibold text-white hover:bg-navy hover:text-white"
          >
            Talk to a founder
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
