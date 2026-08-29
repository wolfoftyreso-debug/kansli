import Link from "next/link";
import { systems } from "@/lib/pixdrift/systems";
import { terminology, terminologyTerm } from "@/lib/pixdrift/terminology";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t, type MessageKey } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicShareMeta } from "@/lib/platform/canonical";

const DOC_AREAS = [
  "overview",
  "concepts",
  "gettingStarted",
  "workflows",
  "integrations",
  "technical",
  "security",
  "releaseNotes",
] as const;

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.metaTitle"),
    description: t(locale, "site.doc.metaDescription"),
    ...publicShareMeta("/documentation"),
  };
}

export default async function DocumentationPage() {
  const locale = await readLocale();
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow={t(locale, "site.doc.eyebrow")}
        title={t(locale, "site.doc.title")}
        intro={t(locale, "site.doc.intro")}
      />

      <div className="mt-10 border border-line bg-surface p-6">
        <p className="pd-label">{t(locale, "site.catalog.spec.mcp")}</p>
        <p className="mt-2 max-w-2xl text-ink-soft">{t(locale, "site.doc.mcpBlurb")}</p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link href="/documentation/mcp" className="underline decoration-line underline-offset-4">
            {t(locale, "site.doc.mcpDocs")}
          </Link>
          <Link
            href="/documentation/capabilities"
            className="underline decoration-line underline-offset-4"
          >
            {t(locale, "site.doc.capabilityGraph")}
          </Link>
          <Link href="/documentation/rest" className="underline decoration-line underline-offset-4">
            {t(locale, "site.doc.rest")}
          </Link>
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="pd-label">{t(locale, "site.doc.perSystem")}</p>
          <ul className="mt-4 border-t border-line">
            {DOC_AREAS.map((area) => (
              <li key={area} className="border-b border-line py-3 text-ink">
                {t(locale, `site.doc.area.${area}` as MessageKey)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="pd-label">{t(locale, "site.doc.systems")}</p>
          <div className="mt-4 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2">
            {systems.map((s) => (
              <Link
                key={s.slug}
                href={`/systems/${s.slug}`}
                className="flex items-baseline justify-between gap-4 bg-surface p-5 hover:bg-paper"
              >
                <span className="font-medium text-ink">{s.name}</span>
                <span className="pd-label">{s.status}</span>
              </Link>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-sm text-muted">{t(locale, "site.doc.coverage")}</p>
        </div>
      </div>

      {/* Controlled terminology (doctrine §15) */}
      <div className="mt-24">
        <p className="pd-label">{t(locale, "site.doc.terminology")}</p>
        <p className="mt-4 max-w-2xl text-ink-soft">{t(locale, "site.doc.terminologyIntro")}</p>
        <dl className="mt-8 border-t border-line">
          {terminology.map((item) => (
            <div
              key={item.term}
              className="grid grid-cols-1 gap-2 border-b border-line py-5 md:grid-cols-[12rem_1fr] md:gap-10"
            >
              <dt className="font-medium text-ink">{terminologyTerm(locale, item)}</dt>
              <dd className="max-w-2xl text-ink-soft">
                {item.definition} <span className="text-muted">{item.context}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Container>
  );
}
