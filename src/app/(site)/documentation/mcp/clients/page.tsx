import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicCanonical } from "@/lib/platform/canonical";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.mcp.clients.metaTitle"),
    alternates: { canonical: publicCanonical("/documentation/mcp/clients") },
  };
}

export default async function McpClientsPage() {
  const locale = await readLocale();
  const example = `{
  "mcpServers": {
    "pixdrift": {
      "url": "https://kansli.vercel.app/mcp",
      "headers": {
        "Authorization": "Bearer \${PIXDRIFT_MCP_TOKEN}",
        "MCP-Protocol-Version": "2026-07-28"
      }
    }
  }
}`;
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/clients" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.mcp.clients.eyebrow")}
          title={t(locale, "site.doc.mcp.clients.title")}
          intro={t(locale, "site.doc.mcp.clients.intro")}
        />
      </div>
      <pre className="mt-10 overflow-x-auto border border-line bg-surface p-5 text-sm">
        {example}
      </pre>
      <p className="mt-6 max-w-2xl text-ink-soft">
        Local development uses the same path on this host: <span className="font-mono">/mcp</span>.
        Older clients that still send <span className="font-mono">initialize</span> get a
        compatibility reply; the advertised protocol is 2026-07-28.
      </p>
    </Container>
  );
}
