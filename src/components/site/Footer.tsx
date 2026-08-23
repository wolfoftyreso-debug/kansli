import Link from "next/link";
import { brand } from "@/lib/pixdrift/brand";
import { PixelMark } from "./PixelMark";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <PixelMark size={22} />
            <span className="text-sm font-semibold tracking-[0.18em] text-ink">{brand.name}</span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{brand.statement}</p>
          <p className="pd-label mt-2">Developed by {brand.company.name}</p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="pd-label">Navigate</p>
          {[
            { href: "/systems", label: "Systems" },
            { href: "/how-it-works", label: "How it works" },
            { href: "/applications", label: "Applications" },
            { href: "/documentation", label: "Documentation" },
            { href: "/why", label: "Why PIXDRIFT exists" },
            { href: "/company", label: "Company" },
          ].map((i) => (
            <Link key={i.href} href={i.href} className="text-sm text-ink-soft hover:text-ink">
              {i.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="pd-label">Offices</p>
          {brand.company.offices.map((o) => (
            <div key={o.entity} className="text-sm text-ink-soft">
              <div className="text-ink">{o.entity}</div>
              <div className="text-muted">
                {o.city}, {o.country}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col justify-between gap-2 px-6 py-6 text-xs text-muted sm:flex-row">
          <p>
            © {year} {brand.company.name}. {brand.name} and {brand.domain} belong to{" "}
            {brand.company.name}.
          </p>
          <p>Stockholm · Houston</p>
        </div>
      </div>
    </footer>
  );
}
