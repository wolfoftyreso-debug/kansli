import Link from "next/link";
import { CompanyAddress } from "@/components/company-address";
import { FooterGrain } from "@/components/footer-grain";
import { legalNav, nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-white">
      <div className="wrap flex flex-wrap items-start justify-between gap-12 py-14 site:pt-14 site:pb-[4.5rem]">
        <div className="max-w-[42ch] text-sm leading-[1.65] text-subtle">
          <div className="mb-2.5 text-xl font-bold tracking-[-0.02em] text-ink">Landvex</div>
          <p className="m-0 mb-5">
            {site.tagline}. US HQ: Houston, Texas · EU HQ: Tyresö, Sweden.
          </p>
          <CompanyAddress compact />
        </div>
        <div className="flex flex-wrap gap-11 text-sm">
          <nav className="grid gap-2.5" aria-label="Work">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="grid gap-2.5" aria-label="Legal">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="grid gap-2.5" aria-label="Contact">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <Link href="/#contact">Contact</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="wrap overflow-hidden py-6">
          <div className="text-[13px] text-subtle">
            © {site.copyrightYear} {site.name}
          </div>
          <FooterGrain />
        </div>
      </div>
    </footer>
  );
}
