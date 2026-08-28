import type { Metadata } from "next";
import Link from "next/link";
import { listOpenApiOperations } from "@/lib/platform/openapi";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "REST — PIXDRIFT",
  description:
    "REST operations generated from the Capability Graph. Same domain services as MCP. Not a handwritten catalog.",
};

export default function RestDocumentationPage() {
  const operations = listOpenApiOperations();
  return (
    <Container>
      <McpDocNav current="/documentation/rest" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow="REST"
          title="One graph. Two interfaces."
          intro="This page is generated from the Capability Graph. Each operation is an MCP tool. If a path is missing here, it is not registered."
        />
      </div>
      <p className="mt-8 text-sm text-muted">
        {operations.length} operations · OpenAPI{" "}
        <Link href="/api/platform/openapi" className="underline decoration-line underline-offset-4">
          /api/platform/openapi
        </Link>
      </p>
      <div className="mt-12 flex flex-col border-t border-line">
        {operations.map((operation) => (
          <article
            key={operation.capabilityId}
            id={operation.capabilityId}
            className="border-b border-line py-8"
          >
            <p className="pd-label">
              {operation.product} · {operation.permission ?? "org read"}
            </p>
            <h2 className="mt-2 font-mono text-lg font-medium">{operation.capabilityId}</h2>
            <p className="mt-2 font-mono text-sm text-ink">
              {operation.method} {operation.openApiPath}
            </p>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-ink-soft">
              {operation.description}
            </p>
            {operation.event ? (
              <p className="mt-3 text-sm text-muted">Event {operation.event}</p>
            ) : null}
          </article>
        ))}
      </div>
    </Container>
  );
}
