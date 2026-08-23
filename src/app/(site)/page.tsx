import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/pixdrift/brand";
import { systems } from "@/lib/pixdrift/systems";
import { PixelField } from "@/components/site/PixelField";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SystemCard } from "@/components/site/SystemCard";
import { Container } from "@/components/site/Container";

export const metadata: Metadata = {
  title: "PIXDRIFT — The layer between systems",
  description: brand.statement,
};

const gaps = [
  "Spreadsheets",
  "Email threads",
  "Manual transfers",
  "Unstructured notes",
  "Small databases",
  "Human memory",
  "Duplicated work",
  "Missing verification",
  "Disconnected steps",
];

const principles = [
  "Solve a clearly defined problem.",
  "Coexist with existing infrastructure.",
  "Reduce unnecessary complexity.",
  "Create a clear point of coordination.",
  "Make information understandable.",
  "Improve real-world execution.",
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="border-b border-line">
        <Container className="grid grid-cols-1 gap-12 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
          <div className="flex flex-col gap-8">
            <p className="pd-label">Inter-system utility software</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-tight text-ink sm:text-7xl">
              The layer
              <br />
              between systems.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-soft">
              Organizations already have powerful systems. {brand.name} builds the focused software
              that handles the connections, workflows and operational gaps between them.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/systems"
                className="bg-ink px-5 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink-soft"
              >
                Explore our systems →
              </Link>
              <Link
                href="/company"
                className="px-5 py-3 text-sm font-medium text-ink underline-offset-4 hover:underline"
              >
                About {brand.name}
              </Link>
            </div>
          </div>
          <PixelField className="w-full" />
        </Container>
      </section>

      {/* PROBLEM */}
      <section className="border-b border-line">
        <Container className="py-20 lg:py-28">
          <SectionHeading
            eyebrow="The problem"
            title={
              <>
                Powerful systems.
                <br />
                Missing pieces.
              </>
            }
            intro="An organization can run several sophisticated platforms and still depend on the small, unmanaged pieces between them. These are not failures of the large systems — they are the inevitable spaces between their defined responsibilities."
          />
          <div className="mt-14 border border-line bg-surface p-6 sm:p-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["ERP", "Accounting", "Government", "Operations"].map((s) => (
                <div
                  key={s}
                  className="flex h-20 items-center justify-center border border-line-strong bg-paper text-sm font-medium text-ink"
                >
                  {s}
                </div>
              ))}
            </div>
            <div className="my-5 flex items-center gap-3">
              <span className="pd-label whitespace-nowrap">PIXDRIFT layer</span>
              <span className="h-px flex-1 bg-accent" />
            </div>
            <div className="flex flex-wrap gap-2">
              {gaps.map((g) => (
                <span
                  key={g}
                  className="border border-line px-2.5 py-1 font-mono text-xs text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm text-muted">
              Individually these look insignificant. Collectively they determine whether the larger
              environment actually works.
            </p>
          </div>
        </Container>
      </section>

      {/* WHAT PIXDRIFT DOES */}
      <section className="border-b border-line">
        <Container className="py-20 lg:py-28">
          <SectionHeading
            eyebrow="What we do"
            title="We build what is missing."
            intro="PIXDRIFT identifies specific operational gaps and develops narrowly focused software around them. Each system does a defined job and coexists with the infrastructure already in place."
          />
          <ol className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {principles.map((p, i) => (
              <li key={p} className="flex items-start gap-4 bg-surface p-6">
                <span className="pd-label pt-1">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-ink">{p}</span>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* SYSTEMS */}
      <section className="border-b border-line">
        <Container className="py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Systems"
              title="An engineered portfolio."
              intro="Purpose-built software for the operational gaps, connections and workflows between larger systems."
            />
            <Link
              href="/systems"
              className="text-sm font-medium text-accent underline-offset-4 hover:underline"
            >
              View all systems →
            </Link>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {systems.slice(0, 6).map((s) => (
              <SystemCard key={s.slug} system={s} />
            ))}
          </div>
        </Container>
      </section>

      {/* PHILOSOPHY + COMPANY */}
      <section>
        <Container className="grid grid-cols-1 gap-px border-x border-b border-line bg-line md:grid-cols-2">
          <Link href="/why" className="group flex flex-col gap-4 bg-surface p-10">
            <p className="pd-label">Why PIXDRIFT exists</p>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              Software environments became more capable and more fragmented at the same time.
            </p>
            <p className="text-ink-soft">
              Large systems solve large categories of problems. PIXDRIFT solves the overlooked ones.
            </p>
            <span className="mt-2 text-sm font-medium text-accent">Read the philosophy →</span>
          </Link>
          <Link href="/company" className="group flex flex-col gap-4 bg-surface p-10">
            <p className="pd-label">Company</p>
            <p className="text-2xl font-semibold tracking-tight text-ink">
              {brand.name} is developed by {brand.company.name}.
            </p>
            <p className="text-ink-soft">
              {brand.company.name} develops software around practical problems affecting
              organizations, infrastructure and society. Stockholm and Houston.
            </p>
            <span className="mt-2 text-sm font-medium text-accent">About the company →</span>
          </Link>
        </Container>
      </section>
    </>
  );
}
