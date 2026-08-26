import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Landvex handles AWS accounts, IAM, infrastructure as code, and EU/US data residency for the automation we design, build and operate.",
  alternates: { canonical: "/security" },
};

export default function SecurityPage() {
  return (
    <DocPage
      eyebrow="Security"
      title="Residency, accounts and audit trails — not policy PDFs."
      lead="We design, build and operate automation on AWS. Security is part of the engineering, not a document we attach afterwards."
    >
      <DocHeading>Cloud foundation</DocHeading>
      <DocText>
        Multi-account AWS setups, IAM, networking and infrastructure as code. EU and
        US data residency is handled at the account boundary, not by a policy that
        asks people to remember where a file lives.
      </DocText>
      <DocList
        items={[
          "Stockholm / EU work in eu-north-1.",
          "Houston / US work in us-east-1.",
          "Least-privilege IAM and no shared credentials.",
          "Infrastructure as code from the first commit.",
        ]}
      />

      <DocHeading>What you own</DocHeading>
      <DocText>
        Code in your accounts, infrastructure as code, no proprietary lock-in on the
        automation we build for you. If you want a handover, you get working systems
        and the code that built them — not a black box you cannot operate.
      </DocText>

      <DocHeading>How we run it</DocHeading>
      <DocText>
        We stay on after launch when that is the engagement. Observability, on-call,
        cost review and retries are part of the service, not extras. Where a system
        processes documents, media or decisions, we keep an audit trail: what ran,
        on which input, with which result.
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
