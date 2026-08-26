import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Why PIXDRIFT exists — PIXDRIFT",
  description:
    "Software environments have become increasingly capable while becoming increasingly fragmented. PIXDRIFT builds the smaller, precise pieces that connect what already exists.",
};

export default function WhyPage() {
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow="Philosophy"
        title="Why PIXDRIFT exists"
        intro="Software environments have become increasingly capable while, at the same time, becoming increasingly fragmented."
      />
      <div className="mt-14 flex max-w-2xl flex-col gap-6 text-lg leading-relaxed text-ink">
        <p>
          Organizations frequently do not need another enormous platform. They need smaller, precise
          pieces of software that connect what already exists.
        </p>
        <p>
          Large systems solve large categories of problems. PIXDRIFT solves the overlooked ones.
        </p>
        <p className="text-muted">
          The name derives from <span className="font-mono text-ink">pixel + drift</span>. A pixel
          is the smallest meaningful unit of a much larger picture. Reduce a complex organization
          into its individual components and the major systems are already there — what remains are
          the small pieces between them: missing connections, fragmented information, overlooked
          processes, handovers and exceptions.
        </p>
        <p>
          Individually those pieces appear insignificant. Collectively they determine whether the
          larger environment actually works.
        </p>
      </div>

      <hr className="pd-hr my-16" />

      <p className="max-w-2xl text-3xl font-semibold leading-snug tracking-tight text-ink">
        Small pieces matter — because the reliability of a larger environment often depends on what
        happens between its major components.
      </p>
    </Container>
  );
}
