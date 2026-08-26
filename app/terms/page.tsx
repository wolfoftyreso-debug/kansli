import type { Metadata } from "next";
import { DocHeading, DocList, DocPage, DocText } from "@/components/doc-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Terms for using landvex.com and sending an enquiry. Client engineering work is contracted separately.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <DocPage
      eyebrow="Terms"
      title="This site is an introduction. The work is a contract."
      lead="These terms cover use of landvex.com and the enquiry form. Design, build and operate work on AWS is agreed in a separate statement of work."
    >
      <DocHeading>Who you are dealing with</DocHeading>
      <DocText>
        Landvex Inc. in Houston, Texas, and Landvex AB in Tyresö, Sweden (org.nr{" "}
        {site.entities.eu.orgNr}). Which entity contracts with you depends on where
        the work sits. The website itself is operated by Landvex.
      </DocText>

      <DocHeading>The website</DocHeading>
      <DocList
        items={[
          "The site describes our capabilities. It is not an offer, a quote, or a commitment to take on a specific process.",
          "Do not scrape, overload or interfere with the site or the enquiry form.",
          "Content on this site is ours unless we say otherwise. You may link to it; you may not copy it as your own.",
        ]}
      />

      <DocHeading>Enquiries</DocHeading>
      <DocText>
        Sending the form or an email does not create a project. We will read it and
        reply. If we take the work, you own the automation we build for you: code in
        your accounts, infrastructure as code, no proprietary lock-in on that work.
        Platform software we already operate, including RIOS, stays ours unless a
        written licence says otherwise.
      </DocText>

      <DocHeading>Liability</DocHeading>
      <DocText>
        The website is provided as-is. For paid engineering work, liability, service
        levels and data processing are set in the contract for that work — not on
        this page.
      </DocText>

      <DocHeading>Contact</DocHeading>
      <DocText>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </DocText>
    </DocPage>
  );
}
