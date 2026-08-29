import { mcpCatalog } from "@/lib/mcp/handle";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "site.doc.mcp.tools.metaTitle") };
}

export default async function McpToolsPage() {
  const locale = await readLocale();
  const catalog = mcpCatalog();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/tools" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.nav.tools")}
          title={t(locale, "site.doc.mcp.tools.title")}
          intro={t(locale, "site.doc.mcp.tools.intro")}
        />
      </div>
      <div className="mt-12 flex flex-col border-t border-line">
        {catalog.tools.map((tool) => (
          <article key={tool.name} className="border-b border-line py-8">
            <p className="pd-label">
              {tool.system} · risk {tool.risk} · {tool.permission ?? "org read"}
            </p>
            <h2 className="mt-2 font-mono text-lg font-medium">{tool.name}</h2>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-ink-soft">{tool.description}</p>
            {tool.rest ? (
              <p className="mt-3 text-sm text-muted">
                REST {tool.rest.method} {tool.rest.path}
              </p>
            ) : null}
            {tool.deprecated ? (
              <p className="mt-2 text-sm">
                {t(locale, "site.doc.mcp.deprecated", { name: tool.replacement ?? "" })}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Container>
  );
}
