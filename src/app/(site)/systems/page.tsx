import type { Metadata } from "next";
import { systems } from "@/lib/pixdrift/systems";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SystemCard } from "@/components/site/SystemCard";

export const metadata: Metadata = {
  title: "Systems — PIXDRIFT",
  description:
    "The catalog of software developed and operated under PIXDRIFT — purpose-built for the operational gaps between larger systems.",
};

export default function SystemsPage() {
  return (
    <Container className="py-20 lg:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Systems"
        title="An engineered product portfolio."
        intro="Each system solves a clearly defined problem between larger platforms, coexists with existing infrastructure, and shares one identity across the family."
      />
      <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((s) => (
          <SystemCard key={s.slug} system={s} />
        ))}
      </div>
    </Container>
  );
}
