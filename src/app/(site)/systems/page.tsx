import type { Metadata } from "next";
import { systems } from "@/lib/pixdrift/systems";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SystemCard } from "@/components/site/SystemCard";

export const metadata: Metadata = {
  title: "System — PIXDRIFT",
  description: "Vad varje system gör. Ett jobb per system. Samma inloggning.",
};

export default function SystemsPage() {
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow="System"
        title="Vad varje system gör."
        intro="Ett jobb per system. TORA tar upphandlingar. RITA tar skatt. Samma inloggning överallt."
      />
      <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((s) => (
          <SystemCard key={s.slug} system={s} />
        ))}
      </div>
    </Container>
  );
}
