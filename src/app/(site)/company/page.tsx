import type { Metadata } from "next";
import { brand } from "@/lib/pixdrift/brand";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SpecTable } from "@/components/site/SpecTable";

export const metadata: Metadata = {
  title: "Company — PIXDRIFT",
  description: `${brand.name} is developed by ${brand.company.name}, operating from Stockholm, Sweden and Houston, Texas.`,
};

const character = [
  ["Precision", "Nothing arbitrary."],
  ["Utility", "Products exist because a real problem exists."],
  ["Restraint", "No inflated language."],
  ["Engineering", "Problems are analyzed and systematically solved."],
  ["Durability", "This is infrastructure, not fashion."],
  ["Interoperability", "Existing infrastructure is respected rather than replaced."],
];

export default function CompanyPage() {
  return (
    <Container className="py-20 lg:py-28">
      <SectionHeading
        as="h1"
        eyebrow="Company"
        title={`${brand.name} is developed by ${brand.company.name}.`}
        intro={`${brand.company.name} develops software around practical problems affecting organizations, infrastructure and society.`}
      />

      <div className="mt-14 max-w-2xl">
        <SpecTable
          rows={[
            { label: "Product", value: `${brand.name} — ${brand.tagline}` },
            { label: "Developed by", value: brand.company.name },
            ...brand.company.offices.map((o) => ({
              label: o.entity,
              value: `${o.city}, ${o.country}`,
            })),
          ]}
        />
      </div>

      <div className="mt-20">
        <p className="pd-label">Corporate character</p>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {character.map(([title, body]) => (
            <div key={title} className="flex flex-col gap-2 bg-surface p-6">
              <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
              <p className="text-sm text-ink-soft">{body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="contact" className="mt-20 scroll-mt-24 border border-line bg-surface p-10">
        <p className="pd-label">Contact</p>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Get in touch</h2>
        <p className="mt-3 max-w-xl text-ink-soft">
          For procurement, partnerships or technical questions about {brand.name} systems, contact{" "}
          {brand.company.name}.
        </p>
        <a
          href={`mailto:hello@${brand.domain}`}
          className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          hello@{brand.domain}
        </a>
      </div>
    </Container>
  );
}
