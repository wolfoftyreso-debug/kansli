import Link from "next/link";
import { brand } from "@/lib/pixdrift/brand";
import { PixelMark } from "./PixelMark";

const nav = [
  { href: "/systems", label: "Systems" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/applications", label: "Applications" },
  { href: "/documentation", label: "Documentation" },
  { href: "/documentation/mcp", label: "MCP" },
  { href: "/company", label: "Company" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${brand.name} home`}>
          <PixelMark size={22} />
          <span className="text-sm font-semibold tracking-[0.18em] text-ink">{brand.name}</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <span className="pd-label" aria-label="Language: English">
            EN
          </span>
          <Link href="/upphandling" className="text-sm text-ink-soft hover:text-ink">
            Group procurement
          </Link>
          <Link href="/company#contact" className="text-sm text-ink-soft hover:text-ink">
            Contact
          </Link>
          <Link
            href="/kansli"
            className="border border-line-strong px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:border-ink"
          >
            Sign in
          </Link>
        </div>

        {/* Mobile menu — progressive, no client JS. */}
        <details className="group relative lg:hidden">
          <summary
            className="flex cursor-pointer list-none items-center gap-2 text-sm text-ink [&::-webkit-details-marker]:hidden"
            aria-label="Open menu"
          >
            <span className="pd-label">Menu</span>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-60 border border-line bg-surface p-2 shadow-sm">
            <nav aria-label="Mobile" className="flex flex-col">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <hr className="pd-hr my-2" />
              <Link
                href="/upphandling"
                className="px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
              >
                Group procurement
              </Link>
              <Link
                href="/company#contact"
                className="px-3 py-2 text-sm text-ink-soft hover:bg-paper hover:text-ink"
              >
                Contact
              </Link>
              <Link
                href="/kansli"
                className="px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
