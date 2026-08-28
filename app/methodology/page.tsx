import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Landvex finds the gap between the systems you already run, proves a slice in production, scales what holds, then hands it over.",
  ...pageMetadata("/methodology"),
};

export default function MethodologyPage() {
  return (
    <DocPage
      eyebrow="Methodology"
      title="From a gap between systems to a production service."
      lead="The people who scope the work are the people who build it. We do not start with a platform pitch. We start with the work as it runs today — especially where it falls between systems that were never meant to talk."
    >
      <DocHeading>What we take on</DocHeading>
      <DocText>
        The work usually lives between systems: a spreadsheet next to an ERP, an
        inbox next to a GIS, a person reconciling two sources of truth. We map that
        gap, define what &quot;correct&quot; looks like, and put a production service
        in the middle — with monitoring, retries and an audit trail. Where judgement
        is genuinely required, the system asks a human, and learns from the answer.
      </DocText>
      <DocText>
        We take two to five project assignments a year. If the gap is not frequent
        enough, expensive enough or well-defined enough to close, we say so at the
        first call rather than at the first invoice.
      </DocText>

      <DocHeading>Step 01 — Find the gap</DocHeading>
      <DocText>
        Two or three days with the people in the middle. We map what the large
        systems do not cover — volume, handling time, error rate — before proposing
        anything. If the gap is not frequent enough, expensive enough, or
        well-defined enough to close, we say so.
      </DocText>
      <DocList
        items={[
          "Who does the work, how often, and which systems they currently touch.",
          "Where errors, delays and rework actually occur.",
          "Which parts require judgement versus which parts are mechanical.",
          "What “done” looks like, in a form a system can check.",
        ]}
      />

      <DocHeading>Step 02 — Prove it on real data</DocHeading>
      <DocText>
        A narrow slice in production within weeks, running alongside how the work is
        done today so the two can be compared directly. We do not demo on synthetic
        samples and call it a result. Accuracy, throughput and cost are reported
        against the current baseline.
      </DocText>

      <DocHeading>Step 03 — Scale what holds</DocHeading>
      <DocText>
        Widen the scope only where accuracy and cost hold up. Everything is
        infrastructure as code from the first commit. The system runs in your
        accounts, with EU and US data residency handled at the account boundary.
      </DocText>

      <DocHeading>Step 04 — Hand over</DocHeading>
      <DocText>
        The system ships as yours, under your name where that is the deal. Runbooks,
        dashboards and the code go with it, and we stay reachable for questions. We
        do not stay on as an operations team.
      </DocText>

      <DocHeading>Own products and white label</DocHeading>
      <DocText>
        Most of the year goes into products for our own companies. Most of those
        systems we then sell on to the organisations that need them most, under their
        name and in their accounts. Assignments are the smaller half of the business,
        which is why there are only a few of them.
      </DocText>
      <DocList
        items={[
          "Own products — built for our own companies, to the standard we would want handed to us.",
          "White label — sold on to the organisations that need them. Your brand, your accounts, your operations.",
          "Selective assignments — two to five engagements a year, founder-led from first call to handover.",
          "Development, not ops — no on-call, no staffing, no managed operations contract.",
        ]}
      />
    </DocPage>
  );
}
