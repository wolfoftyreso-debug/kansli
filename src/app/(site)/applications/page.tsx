import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";

export const metadata: Metadata = {
  title: "Applications — PIXDRIFT",
  description:
    "Where the spaces between systems matter most: environments that run many capable platforms and still depend on the connections between them.",
};

const sectors = [
  {
    title: "Public authorities & municipalities",
    body: "Government, case and record systems that must exchange information reliably, with verification and a clear audit trail.",
  },
  {
    title: "Infrastructure operators",
    body: "Operational, asset and reporting systems where handovers and cross-system visibility decide whether work actually completes.",
  },
  {
    title: "Industry & workshops",
    body: "Domain software surrounded by manual steps — diagnosis, evidence, protocols — that benefit from a precise coordinating layer.",
  },
  {
    title: "Large organizations",
    body: "ERP, accounting and operational suites that each work well, with fragmented information and duplicated work between them.",
  },
  {
    title: "Education & training",
    body: "Environments where the same structured information must serve both operational use and teaching, without maintaining it twice.",
  },
];

export default function ApplicationsPage() {
  return (
    <Container className="py-20 lg:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Applications"
        title="Where the in-between matters."
        intro="PIXDRIFT is built for environments that already run capable systems and still depend on the operational gaps between them."
      />
      <div className="mt-14 border-t border-line">
        {sectors.map((s) => (
          <div
            key={s.title}
            className="grid grid-cols-1 gap-3 border-b border-line py-8 md:grid-cols-[18rem_1fr] md:gap-10"
          >
            <h2 className="text-xl font-semibold tracking-tight text-ink">{s.title}</h2>
            <p className="max-w-2xl text-ink-soft">{s.body}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}
