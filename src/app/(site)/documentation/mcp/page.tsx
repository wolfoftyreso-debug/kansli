import type { Metadata } from "next";
import Link from "next/link";
import { MCP_PROTOCOL_VERSION } from "@pixdrift/mcp-core";
import { mcpCatalog } from "@/lib/mcp/handle";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "MCP — PIXDRIFT Documentation",
  description: "Agent interface to the same Pixdrift domain services as REST.",
};

export default function McpOverviewPage() {
  const catalog = mcpCatalog();
  return (
    <Container className="py-16 lg:py-24">
      <McpDocNav current="/documentation/mcp" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="MCP"
          title="REST is the machine interface. MCP is the agent interface."
          intro="Both call the same application services. MCP does not have its own booking logic, ledger, or tenant table."
        />
      </div>
      <dl className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
        <div>
          <dt className="pd-label">Endpoint</dt>
          <dd className="mt-2 font-mono text-sm">POST /mcp</dd>
        </div>
        <div>
          <dt className="pd-label">Protocol</dt>
          <dd className="mt-2 font-mono text-sm">{MCP_PROTOCOL_VERSION}</dd>
        </div>
        <div>
          <dt className="pd-label">Tools</dt>
          <dd className="mt-2">{catalog.tools.length} registered from source</dd>
        </div>
        <div>
          <dt className="pd-label">Auth</dt>
          <dd className="mt-2">Pixdrift Identity access token or Kansli session</dd>
        </div>
      </dl>
      <p className="mt-10 max-w-2xl text-ink-soft">
        Example: create an office task with MCP{" "}
        <span className="font-mono">create_office_task</span> or REST{" "}
        <span className="font-mono">POST /api/kansli/tasks</span>. Both call{" "}
        <span className="font-mono">addTask</span>.
      </p>
      <p className="mt-6">
        <Link
          href="/documentation/mcp/tools"
          className="underline decoration-line underline-offset-4"
        >
          Tool catalog
        </Link>
        {" · "}
        <Link href="/platform/mcp" className="underline decoration-line underline-offset-4">
          Signed-in explorer
        </Link>
        {" · "}
        <Link href="/api/mcp/health" className="underline decoration-line underline-offset-4">
          Health
        </Link>
      </p>
    </Container>
  );
}
