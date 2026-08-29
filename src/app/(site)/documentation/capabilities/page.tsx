import Link from "next/link";
import { buildCapabilityGraph } from "@/lib/platform/capability-graph";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.graph.metaTitle"),
    description: t(locale, "site.doc.graph.metaDescription"),
  };
}

export default async function CapabilityGraphPage() {
  const locale = await readLocale();
  const graph = buildCapabilityGraph();
  return (
    <Container>
      <McpDocNav current="/documentation/capabilities" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.capabilityGraph")}
          title={t(locale, "site.doc.graph.title")}
          intro={t(locale, "site.doc.graph.intro")}
        />
      </div>
      <p className="mt-8 text-sm text-muted">
        {t(locale, "site.doc.graph.source", {
          source: graph.source,
          count: graph.capabilities.length,
        })}{" "}
        <Link
          href="/api/platform/capabilities"
          className="underline decoration-line underline-offset-4"
        >
          /api/platform/capabilities
        </Link>
      </p>
      <div className="mt-12 flex flex-col border-t border-line">
        {graph.capabilities.map((capability) => (
          <article key={capability.id} className="border-b border-line py-8">
            <p className="pd-label">
              {capability.product} · {capability.domain} · risk {capability.risk}
            </p>
            <h2 className="mt-2 font-mono text-lg font-medium">{capability.id}</h2>
            <p className="mt-2 text-ink-soft">{capability.title}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">REST</dt>
                <dd className="font-mono">
                  {capability.interfaces.rest
                    ? `${capability.interfaces.rest.method} ${capability.interfaces.rest.path}`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">MCP</dt>
                <dd className="font-mono">{capability.interfaces.mcp}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "site.doc.graph.event")}</dt>
                <dd className="font-mono">{capability.interfaces.event ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "site.doc.graph.sdk")}</dt>
                <dd>{t(locale, "site.doc.graph.notRegistered")}</dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "site.doc.graph.permission")}</dt>
                <dd className="font-mono">
                  {capability.permissions.length > 0
                    ? capability.permissions.join(", ")
                    : "org read"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t(locale, "site.catalog.documentation")}</dt>
                <dd>
                  <Link
                    href={capability.documentation.slug}
                    className="underline decoration-line underline-offset-4"
                  >
                    {capability.documentation.slug}
                  </Link>
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Container>
  );
}
