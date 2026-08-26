import type { Metadata } from "next";
import { CompanyAddress } from "@/components/company-address";
import { DocHeading, DocPage, DocText } from "@/components/doc-page";
import { landvexAb, landvexInc, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Company information",
  description:
    "Legal entity details for Landvex AB in Tyresö and Landvex Inc. in Houston.",
  alternates: { canonical: "/company" },
};

export default function CompanyPage() {
  return (
    <DocPage
      eyebrow="Company information"
      title="Who you are dealing with."
      lead="Landvex is two companies and one engineering team. The Swedish company details below are the registered particulars for Landvex AB."
    >
      <DocHeading>Landvex AB</DocHeading>
      <DocText>
        Limited company (aktiebolag) registered in Sweden. Registered office (säte):{" "}
        {landvexAb.seat}, {landvexAb.county}.
      </DocText>
      <div className="mb-8 text-[16px] leading-[1.7] text-muted">
        <CompanyAddress />
      </div>

      <DocHeading>Landvex Inc.</DocHeading>
      <DocText>
        {landvexInc.legalName} is a Texas corporation based in {landvexInc.city},{" "}
        {landvexInc.region}. It is the US headquarters.
      </DocText>
      <DocText>
        Which entity contracts for a given engagement depends on where the work sits.
        Enquiries: <a href={`mailto:${site.email}`}>{site.email}</a>.
      </DocText>
    </DocPage>
  );
}
