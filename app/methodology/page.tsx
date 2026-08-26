import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Landvex takes a manual process onto AWS: measure it, prove a slice in production, scale what holds, then operate it.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <DocPage
      eyebrow="Methodology"
      title="From a manual task to a production service."
      lead="The people who scope the work are the people who build it. We do not start with a platform pitch. We start with the process as it runs today, on real volume, with the people who currently do it."
    >
      <DocHeading>What we take on</DocHeading>
      <DocText>
        Most of the work we take on starts as a spreadsheet, an inbox, or a person
        checking things by hand. We map that process, define what &quot;correct&quot;
        means, and move it onto AWS as a service with monitoring, retries and an
        audit trail. Where judgement is genuinely required, the system asks a human
        — and learns from the answer.
      </DocText>

      <DocHeading>Step 01 — Find the manual work</DocHeading>
      <DocText>
        Two or three days with the people doing the task. We measure volume, handling
        time and error rate before proposing anything. If the work is not frequent
        enough, expensive enough, or well-defined enough to automate, we say so.
      </DocText>
      <DocList
        items={[
          "Who does the work, how often, and what they currently use.",
          "Where errors, delays and rework actually occur.",
          "Which parts require judgement versus which parts are mechanical.",
          "What “done” looks like, in a form a system can check.",
        ]}
      />

      <DocHeading>Step 02 — Prove it on real data</DocHeading>
      <DocText>
        A narrow slice in production within weeks, running alongside the manual
        process so the two can be compared directly. We do not demo on synthetic
        samples and call it a result. Accuracy, throughput and cost are reported
        against the manual baseline.
      </DocText>

      <DocHeading>Step 03 — Scale what holds</DocHeading>
      <DocText>
        Widen the scope only where accuracy and cost hold up. Everything is
        infrastructure as code from the first commit. The system runs in your AWS
        accounts, with EU and US data residency handled at the account boundary.
      </DocText>

      <DocHeading>Step 04 — Operate and extend</DocHeading>
      <DocText>
        Monitoring, cost control and a standing review of the next process worth
        removing from someone&apos;s day. Handover is optional, never abrupt.
      </DocText>

      <DocHeading>How we use RIOS</DocHeading>
      <DocText>
        Landvex operates RIOS, a vendor-agnostic system that turns continuous video
        observations of the physical world into structured intelligence. It is the
        clearest statement of what we do: a workflow that used to require inspectors,
        spreadsheets and site visits, now delivered as a continuously running service.
        The same team builds client automation and runs this platform.
      </DocText>
      <DocList
        items={[
          "Capture — mobile, body, vehicle and drone capture. Original media immutable.",
          "Orchestration — specialist models per observation: classification, detection, segmentation, depth, OCR.",
          "Active learning — humans are asked only when the expected learning value clears a threshold.",
          "Knowledge graph — assets, relationships, condition and history, continuously indexed. Every output traceable to source, observation and model.",
        ]}
      />
    </DocPage>
  );
}
