import type { Metadata } from "next";
import { mcpCatalog } from "@/lib/mcp/handle";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "MCP tools — PIXDRIFT",
};

export default function McpToolsPage() {
  const catalog = mcpCatalog();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/tools" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="Tools"
          title="Generated from the registry"
          intro="This page is not hand-copied. If a tool is missing here, it is not registered."
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
              <p className="mt-2 text-sm">Deprecated. Use {tool.replacement}.</p>
            ) : null}
          </article>
        ))}
      </div>
    </Container>
  );
}
