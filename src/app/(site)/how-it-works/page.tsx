import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { PixelFlow } from "@/components/site/PixelFlow";
import { pixdriftStack } from "@/lib/pixdrift/stack";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicCanonical } from "@/lib/platform/canonical";

const steps = [
  {
    no: "01",
    title: "Locate the gap",
    body: "Find a specific, recurring problem that falls between the responsibilities of existing systems — a handover, a verification, a missing connection.",
  },
  {
    no: "02",
    title: "Define it precisely",
    body: "Reduce it to one clearly defined problem. If it cannot be stated precisely, it is not yet ready to build.",
  },
  {
    no: "03",
    title: "Build the missing piece",
    body: "Develop narrowly focused software that coexists with the infrastructure already in place, rather than replacing it.",
  },
  {
    no: "04",
    title: "Coordinate and verify",
    body: "Create a clear point of coordination and make the information understandable and checkable.",
  },
  {
    no: "05",
    title: "Connect through one identity",
    body: "Systems share PIXDRIFT Identity — one sign-on and verified access tokens — so they interoperate without new secrets.",
  },
  {
    no: "06",
    title: "Improve execution",
    body: "The measure is real-world execution: less friction, fewer manual transfers, more reliable outcomes.",
  },
];

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.how.metaTitle"),
    description: t(locale, "site.how.metaDescription"),
    alternates: { canonical: publicCanonical("/how-it-works") },
  };
}

export default async function HowItWorksPage() {
  const locale = await readLocale();
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow={t(locale, "site.how.eyebrow")}
        title={t(locale, "site.how.title")}
        intro={t(locale, "site.how.intro")}
      />
      <ol className="mt-14 border-t border-line">
        {steps.map((s) => (
          <li
            key={s.no}
            className="grid grid-cols-1 gap-3 border-b border-line py-8 md:grid-cols-[8rem_1fr] md:gap-10"
          >
            <span className="pd-label pt-1">{s.no}</span>
            <div className="flex max-w-2xl flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">{s.title}</h2>
              <p className="text-ink-soft">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* The PIXDRIFT stack */}
      <div className="mt-24">
        <p className="pd-label">The PIXDRIFT stack</p>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Most systems combine six functions — connect what exists, automate what repeats, surface
          what matters.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {pixdriftStack.map((fn) => (
            <div key={fn.no} className="flex flex-col gap-2 bg-surface p-6">
              <div className="flex items-baseline gap-3">
                <span className="pd-label">{fn.no}</span>
                <h3 className="text-lg font-semibold tracking-tight text-ink">{fn.name}</h3>
              </div>
              <p className="text-sm text-ink-soft">{fn.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Event-driven by default */}
      <div className="mt-20">
        <p className="pd-label">Event-driven by default</p>
        <p className="mt-4 max-w-2xl text-lg text-ink-soft">
          Automation before interface. The best interface for a repetitive process is often no
          interface at all.
        </p>
        <ol className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-sm text-ink">
          {["Event", "Condition", "Action", "Verification"].map((s, i, arr) => (
            <li key={s} className="flex items-center gap-3">
              <span>{s}</span>
              {i < arr.length - 1 ? (
                <span aria-hidden className="text-faint">
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
        <div className="mt-8 max-w-3xl">
          <PixelFlow from="Event" to="Action" />
        </div>
      </div>
    </Container>
  );
}
