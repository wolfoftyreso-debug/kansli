import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { SpecTable } from "@/components/site/SpecTable";
import { RegionIndicator, StatusIndicator } from "@/components/site/indicators";
import { catalogField, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { toolsForSystem } from "@/lib/mcp/catalog";
import { getSystem, STEWARDSHIP_LABEL, systems } from "@/lib/pixdrift/systems";

export function generateStaticParams() {
  return systems.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await readLocale();
  const system = getSystem(slug);
  if (!system) return { title: t(locale, "site.systems.metaTitle") };
  return {
    title: `${system.name} — PIXDRIFT`,
    description: catalogField(locale, slug, "summary"),
  };
}

export default async function SystemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await readLocale();
  const system = getSystem(slug);
  if (!system) notFound();

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-line">
        <Container className="py-4">
          <nav aria-label="Breadcrumb" className="pd-label flex items-center gap-2">
            <Link href="/" className="hover:text-ink">
              PIXDRIFT
            </Link>
            <span aria-hidden>/</span>
            <Link href="/systems" className="hover:text-ink">
              {t(locale, "site.systems.eyebrow")}
            </Link>
            <span aria-hidden>/</span>
            <span className="text-ink">{system.name}</span>
          </nav>
        </Container>
      </div>

      {/* Product header */}
      <section className="border-b border-line">
        <Container>
          <p className="pd-label">System {system.index}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{system.name}</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-soft">
            {catalogField(locale, system.slug, "purpose")}
          </p>
          <div className="mt-10">
            <SpecTable
              rows={[
                { label: "Category", value: catalogField(locale, system.slug, "category") },
                { label: "Stewardship", value: STEWARDSHIP_LABEL[system.stewardship] },
                { label: "Status", value: <StatusIndicator status={system.status} /> },
                { label: "Region", value: <RegionIndicator regions={system.regions} /> },
                {
                  label: "REST API",
                  value: "Available",
                },
                {
                  label: "MCP",
                  value:
                    toolsForSystem(system.slug).length > 0
                      ? `${toolsForSystem(system.slug).length} tools`
                      : "Not exposed",
                },
              ]}
            />
          </div>
        </Container>
      </section>

      {/* Standardized sections 01–10 */}
      <Container className="py-16 lg:py-20">
        <div className="flex flex-col">
          {system.sections.map((section) => (
            <section
              key={section.no}
              className="grid grid-cols-1 gap-4 border-b border-line py-10 md:grid-cols-[8rem_1fr] md:gap-10"
            >
              <div className="pd-label pt-1">
                {section.no} — {section.title}
              </div>
              <div className="flex max-w-2xl flex-col gap-4">
                {section.body.length > 0 ? (
                  section.body.map((p, i) => (
                    <p key={i} className="text-lg leading-relaxed text-ink">
                      {p}
                    </p>
                  ))
                ) : (
                  <p className="text-ink-soft">
                    <span className="pd-label">Forthcoming</span>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/documentation/mcp"
            className="border border-line-strong px-5 py-3 text-sm font-medium text-ink hover:border-ink"
          >
            MCP
          </Link>
          <Link
            href="/documentation"
            className="border border-line-strong px-5 py-3 text-sm font-medium text-ink hover:border-ink"
          >
            Documentation
          </Link>
          <Link
            href="/systems"
            className="px-5 py-3 text-sm font-medium text-ink underline-offset-4 hover:underline"
          >
            ← All systems
          </Link>
        </div>
      </Container>
    </>
  );
}
