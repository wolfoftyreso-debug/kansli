import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "How it works — PIXDRIFT",
  description:
    "PIXDRIFT identifies a specific operational gap between larger systems and builds narrowly focused software around it — coexisting with existing infrastructure.",
};

const steps = [
  {
    no: "01",
    title: "Locate the gap",
    body: "Find a specific, recurring problem that falls between the responsibilities of existing systems — a handover, a verification, a missing connection.",
  },
  {
    no: "02",
    title: "Define it precisely",
    body: "Reduce it to one clearly defined problem. If it cannot be stated precisely, it is not yet ready to build.",
  },
  {
    no: "03",
    title: "Build the missing piece",
    body: "Develop narrowly focused software that coexists with the infrastructure already in place, rather than replacing it.",
  },
  {
    no: "04",
    title: "Coordinate and verify",
    body: "Create a clear point of coordination and make the information understandable and checkable.",
  },
  {
    no: "05",
    title: "Connect through one identity",
    body: "Systems share PIXDRIFT Identity — one sign-on and verified access tokens — so they interoperate without new secrets.",
  },
  {
    no: "06",
    title: "Improve execution",
    body: "The measure is real-world execution: less friction, fewer manual transfers, more reliable outcomes.",
  },
];

export default function HowItWorksPage() {
  return (
    <Container className="py-20 lg:py-28">
      <SectionHeading
        as="h1"
        eyebrow="How it works"
        title="A method, not a platform."
        intro="PIXDRIFT solves concrete problems. Not digital transformation — specific operational gaps, addressed one system at a time."
      />
      <ol className="mt-14 border-t border-line">
        {steps.map((s) => (
          <li
            key={s.no}
            className="grid grid-cols-1 gap-3 border-b border-line py-8 md:grid-cols-[8rem_1fr] md:gap-10"
          >
            <span className="pd-label pt-1">{s.no}</span>
            <div className="flex max-w-2xl flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{s.title}</h2>
              <p className="text-ink-soft">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Container>
  );
}
