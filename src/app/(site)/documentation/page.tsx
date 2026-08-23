import type { Metadata } from "next";
import Link from "next/link";
import { systems } from "@/lib/pixdrift/systems";
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
    <Container className="py-20 lg:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Documentation"
        title="Documentation is part of the product."
        intro="Every system links into the same structured documentation environment, with a consistent shape so information is always where you expect it."
      />

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
    </Container>
  );
}
