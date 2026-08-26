import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Landvex handles accounts, IAM, infrastructure as code, and EU/US data residency for the systems we design and build.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Security"
      title="Residency, accounts and audit trails — not policy PDFs."
      lead="We design and build systems that sit between the platforms you already run. Security is part of the engineering, not a document we attach afterwards."
    >
      <DocHeading>Cloud foundation</DocHeading>
      <DocText>
        Multi-account setups, IAM, networking and infrastructure as code, built in
        your cloud account rather than ours. Data residency is set at the account
        boundary, not by a policy that asks people to remember where a file lives.
      </DocText>
      <DocList
        items={[
          "EU work defaults to eu-north-1, Stockholm.",
          "US work defaults to us-east-1.",
          "Least-privilege IAM and no shared credentials.",
          "Infrastructure as code from the first commit.",
        ]}
      />

      <DocHeading>What you own</DocHeading>
      <DocText>
        The code is in your accounts, the infrastructure is code, and there is no
        proprietary lock-in on what we build for you. Handover is the end of every
        engagement, not an upsell: you get working systems and the code that built
        them — not a black box you cannot open.
      </DocText>

      <DocHeading>What ships with the system</DocHeading>
      <DocText>
        Observability, retries and an audit trail are part of the build, not a
        managed service we sell afterwards. Where a system processes documents,
        media or decisions, the trail records what ran, on which input, with which
        result. Running it day to day stays with you; we are a development company
        and do not take on operations.
      </DocText>

      <DocHeading>Contact</DocHeading>
      <DocText>
        Security questions, questionnaires and data processing terms:{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. You will hear back from a
        founder.
      </DocText>
    </DocPage>
  );
}
