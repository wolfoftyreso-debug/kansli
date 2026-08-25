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

      {/* Why we build (doctrine §10) */}
      <div className="mt-24 grid grid-cols-1 gap-8 md:grid-cols-[8rem_1fr] md:gap-10">
        <p className="pd-label pt-1">Why we build</p>
        <div className="flex max-w-2xl flex-col gap-5 text-lg leading-relaxed text-ink">
          <p>
            {brand.name} grew out of a recurring experience. After years of building and operating
            businesses, we repeatedly encountered small but consequential problems that sat between
            the systems we already used.
          </p>
          <p>
            We looked for software to solve them. Sometimes it existed — and we used it. Sometimes
            it almost existed. And sometimes the obvious solution simply wasn&rsquo;t there, so we
            built what we needed.
          </p>
          <p>
            Most of these projects began as internal tools, used, changed and improved because they
            had to work in real operating environments. Occasionally one became something more: it
            solved the problem unusually well, other organizations had the same problem, and
            internal software became worth maintaining for others.
          </p>
          <p className="text-muted">
            That is how {brand.name} grows — not by searching for categories to disrupt, but by
            building the software we thought should already exist.
          </p>
        </div>
      </div>

      {/* Development model (doctrine §8) */}
      <div className="mt-20">
        <p className="pd-label">How a system comes to exist</p>
        <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
          {["Experience", "Problem", "Search", "Build", "Use", "Improve", "Validate", "Decide"].map(
            (step, i, arr) => (
              <li key={step} className="flex items-center gap-3">
                <span className="font-mono text-sm text-ink">{step}</span>
                {i < arr.length - 1 ? (
                  <span aria-hidden className="text-faint">
                    →
                  </span>
                ) : null}
              </li>
            ),
          )}
        </ol>
      </div>

      {/* Three outcomes (doctrine §4) */}
      <div className="mt-16">
        <p className="pd-label">Three possible outcomes</p>
        <div className="mt-6 grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
          <div className="flex flex-col gap-2 bg-surface p-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Internal</h2>
            <p className="text-sm text-ink-soft">
              Useful to us. We keep it and improve it when necessary.
            </p>
          </div>
          <div className="flex flex-col gap-2 bg-surface p-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Open source</h2>
            <p className="text-sm text-ink-soft">
              Useful beyond us, but it does not require us to operate it. We publish, document and
              let others use and build on it.
            </p>
          </div>
          <div className="flex flex-col gap-2 bg-surface p-6">
            <h2 className="text-lg font-semibold tracking-tight text-ink">Managed product</h2>
            <p className="text-sm text-ink-soft">
              Important enough that users should not have to operate it themselves. Then we take
              responsibility for it.
            </p>
            <p className="mt-1 font-mono text-xs leading-relaxed text-muted">
              hosting · security · availability · maintenance · updates · documentation · support ·
              data integrity · compatibility · long-term operation
            </p>
          </div>
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          Software becomes a {brand.name} product when we are prepared to take responsibility for it
          — not merely when it is for sale.
        </p>
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
          href={`mailto:${brand.contactEmail}`}
          className="mt-6 inline-block bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          {brand.contactEmail}
        </a>
      </div>
    </Container>
  );
}
