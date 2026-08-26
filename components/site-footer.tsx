import Link from "next/link";
import { legalNav, nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-white">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-start justify-between gap-12 px-6 py-14 site:px-10 site:pt-14 site:pb-[72px]">
        <div>
          <div className="mb-2.5 text-xl font-bold tracking-[-0.02em]">Landvex</div>
          <p className="m-0 max-w-[38ch] text-sm text-subtle">
            Founder-led automation engineering on AWS. US HQ: Houston, Texas · EU HQ:
            Tyresö, Sweden.
          </p>
        </div>
        <div className="flex flex-wrap gap-11 text-sm">
          <div className="grid gap-2.5">
            {nav.slice(0, 3).map((item) => (
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
            <a href={site.linkedin} rel="noopener noreferrer" target="_blank">
              LinkedIn
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1240px] px-6 py-6 text-[13px] text-subtle site:px-10">
          © {new Date().getFullYear()} Landvex Inc / Landvex AB · Org.nr{" "}
          {site.entities.eu.orgNr}
        </div>
      </div>
    </footer>
  );
}
