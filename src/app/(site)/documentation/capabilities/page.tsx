import type { Metadata } from "next";
import Link from "next/link";
import { buildCapabilityGraph } from "@/lib/platform/capability-graph";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Capability Graph — PIXDRIFT",
  description:
    "Machine-readable registry of Pixdrift capabilities. Generated from the MCP registry, not copied by hand.",
};

export default function CapabilityGraphPage() {
  const graph = buildCapabilityGraph();
  return (
    <Container className="py-16 lg:py-24">
      <McpDocNav current="/documentation/capabilities" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="Capability Graph"
          title="One list. Several interfaces."
          intro="This page is generated from the MCP registry. If a capability is missing here, it is not registered. NORA, MOVA and SAGA are not in this repository."
        />
      </div>
      <p className="mt-8 text-sm text-muted">
        Source {graph.source} · {graph.capabilities.length} capabilities · JSON{" "}
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
                <dt className="text-muted">Event</dt>
                <dd className="font-mono">{capability.interfaces.event ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">SDK / webhook / ChatGPT</dt>
                <dd>not registered</dd>
              </div>
              <div>
                <dt className="text-muted">Permission</dt>
                <dd className="font-mono">
                  {capability.permissions.length > 0
                    ? capability.permissions.join(", ")
                    : "org read"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Documentation</dt>
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
