import type { Metadata } from "next";
import { CompanyAddress } from "@/components/company-address";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { landvexAb, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Landvex processes personal data from landvex.com and the enquiry form.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Privacy"
      title="What happens to an enquiry."
      lead="This notice covers landvex.com and the contact form. It does not describe systems we later run in a customer’s AWS accounts under a separate agreement."
    >
      <DocHeading>Controller</DocHeading>
      <DocText>
        For people in the EU/EEA, UK and Switzerland, {landvexAb.legalName} is the
        controller. For people in North America, Landvex Inc. is the controller.
      </DocText>
      <div className="mb-8 text-[16px] leading-[1.7] text-muted">
        <CompanyAddress />
      </div>

      <DocHeading>What we collect and why</DocHeading>
      <DocText>
        The form collects name, organisation, work email and a description of the
        work between your systems. We use that to reply and, if you ask, to start a
        technical review. The form is optional; without those details we cannot
        reply. The legal basis is legitimate interests in answering a business
        enquiry (GDPR art. 6(1)(f)), and taking steps prior to a contract if the
        conversation becomes an engagement (art. 6(1)(b)).
      </DocText>
      <DocList
        items={[
          "We do not use the form for marketing lists or newsletters.",
          "This website does not set analytics, advertising or other non-essential cookies.",
          "A hidden field is used to ignore obvious bot submissions. Those submissions are discarded and not emailed.",
        ]}
      />

      <DocHeading>Who receives the data</DocHeading>
      <DocText>
        The message is emailed to {site.email} through Resend, which we use as a
        processor for delivery. The site is hosted on AWS. Resend may process data
        in the United States. Where GDPR applies, that is an international transfer;
        we rely on the provider’s Standard Contractual Clauses and their published
        data-processing terms. We do not sell personal data.
      </DocText>
      <DocText>
        Hosting and abuse controls may process IP address and user agent as part of
        the request. We do not operate a separate database of form submissions on
        this website; the record is the email.
      </DocText>

      <DocHeading>Retention</DocHeading>
      <DocText>
        Mail is kept as long as needed to answer you. If we do not take on the work,
        we delete or archive the thread within 24 months, unless a longer legal duty
        applies.
      </DocText>

      <DocHeading>Your rights</DocHeading>
      <DocText>
        You may ask for access, rectification, erasure, restriction, objection or
        portability where those rights apply. Write to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. In Sweden or the EEA you
        may also complain to{" "}
        <a href="https://www.imy.se/">IMY</a>, the Swedish Authority for Privacy
        Protection.
      </DocText>
    </DocPage>
  );
}
