import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { nav } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="relative sticky top-0 z-50 border-b border-line bg-white/92 backdrop-blur-[10px]">
      <div className="wrap flex h-[4.75rem] items-center justify-between gap-8">
        <Link
          href="/"
          className="flex items-baseline gap-3 text-ink hover:text-ink"
          aria-label="Landvex home"
        >
          <span className="text-[22px] font-bold tracking-[-0.02em]">Landvex</span>
          <span className="hidden h-[18px] w-px bg-edge min-[520px]:inline-block" />
          <span className="eyebrow hidden text-subtle min-[520px]:inline">
            Stockholm · Houston
          </span>
        </Link>

        <nav className="hidden items-center gap-[34px] site:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link text-sm font-medium">
              {item.label}
            </Link>
          ))}
          <Link href="/#contact" className="btn btn-teal px-[1.375rem] py-[0.7rem] text-sm">
            Talk to a founder
          </Link>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
