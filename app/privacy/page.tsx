import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Landvex handles personal data from this website and the enquiry form. Landvex Inc. in Houston and Landvex AB in Tyresö.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <DocPage
      eyebrow="Privacy"
      title="Your enquiry stays a business conversation."
      lead="This policy covers landvex.com and the contact form. It does not try to describe every future client system we may operate inside a customer’s AWS accounts."
    >
      <DocHeading>Who we are</DocHeading>
      <DocText>
        Landvex Inc., Houston, Texas (US HQ), and Landvex AB, Tyresö, Sweden (EU HQ),
        org.nr {site.entities.eu.orgNr}. For website visitors and people who send an
        enquiry from the EU/EEA, Landvex AB is the controller. For visitors and
        enquiries from North America, Landvex Inc. is the controller.
      </DocText>

      <DocHeading>What we collect</DocHeading>
      <DocText>
        If you email us or use the form, we process the fields you submit: name,
        organisation, work email, and the process you want automated. Server logs may
        include IP address, user agent and the time of the request, used to keep the
        form from being abused.
      </DocText>
      <DocList
        items={[
          "Purpose: reply to your enquiry and, if you ask, start a technical review.",
          "Legal basis: legitimate interests in answering business enquiries, and steps prior to a contract if we take on the work.",
          "We do not buy lists, and we do not use the form for marketing sequences.",
        ]}
      />

      <DocHeading>Processors</DocHeading>
      <DocText>
        The form is delivered by Resend, which sends the message to{" "}
        {site.email}. Hosting is on Vercel. We do not sell personal data.
      </DocText>

      <DocHeading>Retention</DocHeading>
      <DocText>
        Enquiry mail is kept for as long as needed to answer you and, if we work
        together, for the engagement file. If we do not take on the work, we delete
        or archive the thread within 24 months unless a longer legal retention
        applies.
      </DocText>

      <DocHeading>Your rights</DocHeading>
      <DocText>
        Depending on where you are, you may have rights of access, rectification,
        erasure, restriction, objection and portability. Write to{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. If you are in Sweden or
        the EEA you may also contact IMY (imy.se).
      </DocText>
    </DocPage>
  );
}
