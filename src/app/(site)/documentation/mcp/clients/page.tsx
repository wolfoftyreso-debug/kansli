import type { Metadata } from "next";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "MCP clients — PIXDRIFT",
};

export default function McpClientsPage() {
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
    <Container className="py-16 lg:py-24">
      <McpDocNav current="/documentation/mcp/clients" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="Clients"
          title="Cursor, Claude, and generic MCP clients"
          intro="Use the platform token pattern. Never hard-code a secret."
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
