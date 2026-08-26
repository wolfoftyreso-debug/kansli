import Link from "next/link";
import { CompanyAddress } from "@/components/company-address";
import { FooterGrain } from "@/components/footer-grain";
import { legalNav, nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-12 px-6 py-14 site:px-10 site:pt-14 site:pb-[72px]">
        <div className="max-w-[42ch] text-sm leading-[1.65] text-subtle">
          <div className="mb-2.5 text-xl font-bold tracking-[-0.02em] text-ink">Landvex</div>
          <p className="m-0 mb-5">
            Founder-led automation engineering on AWS. US HQ: Houston, Texas · EU HQ:
            Tyresö, Sweden.
          </p>
          <CompanyAddress compact />
        </div>
        <div className="flex flex-wrap gap-11 text-sm">
          <div className="grid gap-2.5">
            {nav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="grid gap-2.5">
            {legalNav.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          <div className="grid gap-2.5">
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <Link href="/#contact">Contact</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1240px] overflow-hidden px-6 py-6 site:px-10">
          <div className="text-[13px] text-subtle">
            © {site.copyrightYear} {site.name}
          </div>
          <FooterGrain />
        </div>
      </div>
    </footer>
  );
}
