import type { Metadata } from "next";
import Link from "next/link";
import { systems } from "@/lib/pixdrift/systems";
import { terminology } from "@/lib/pixdrift/terminology";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Documentation — PIXDRIFT",
  description:
    "Structured documentation for PIXDRIFT systems: overview, concepts, getting started, workflows, integrations, technical reference, security and release notes.",
};

const areas = [
  "Overview",
  "Concepts",
  "Getting started",
  "Workflows",
  "Integrations",
  "Technical reference",
  "Security",
  "Release notes",
];

export default function DocumentationPage() {
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow="Documentation"
        title="Documentation is part of the product."
        intro="Every system links into the same structured documentation environment, with a consistent shape so information is always where you expect it."
      />

      <div className="mt-10 border border-line bg-surface p-6">
        <p className="pd-label">MCP</p>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Agents use MCP. Applications use REST. Both call the same domain services.
        </p>
        <p className="mt-4 flex flex-wrap gap-4">
          <Link href="/documentation/mcp" className="underline decoration-line underline-offset-4">
            MCP documentation
          </Link>
          <Link
            href="/documentation/capabilities"
            className="underline decoration-line underline-offset-4"
          >
            Capability Graph
          </Link>
          <Link href="/documentation/rest" className="underline decoration-line underline-offset-4">
            REST
          </Link>
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="pd-label">Per-system structure</p>
          <ul className="mt-4 border-t border-line">
            {areas.map((a) => (
              <li key={a} className="border-b border-line py-3 text-ink">
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="pd-label">Systems</p>
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
          <p className="mt-6 max-w-xl text-sm text-muted">
            Documentation coverage is tracked as a machine-readable matrix; capabilities that are
            not yet documented are reported rather than assumed complete.
          </p>
        </div>
      </div>

      {/* Controlled terminology (doctrine §15) */}
      <div className="mt-24">
        <p className="pd-label">Terminology</p>
        <p className="mt-4 max-w-2xl text-ink-soft">
          One controlled vocabulary across every system. English is canonical; translations derive
          from it so terms do not drift between products.
        </p>
        <dl className="mt-8 border-t border-line">
          {terminology.map((t) => (
            <div
              key={t.term}
              className="grid grid-cols-1 gap-2 border-b border-line py-5 md:grid-cols-[12rem_1fr] md:gap-10"
            >
              <dt className="font-medium text-ink">{t.term}</dt>
              <dd className="max-w-2xl text-ink-soft">
                {t.definition} <span className="text-muted">{t.context}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Container>
  );
}
