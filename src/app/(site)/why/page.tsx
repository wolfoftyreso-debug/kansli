import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.why.metaTitle"),
    description: t(locale, "site.why.metaDescription"),
  };
}

export default async function WhyPage() {
  const locale = await readLocale();
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow={t(locale, "site.why.eyebrow")}
        title={t(locale, "site.why.title")}
        intro={t(locale, "site.why.intro")}
      />
      <div className="mt-14 flex max-w-2xl flex-col gap-6 text-lg leading-relaxed text-ink">
        <p>
          Organizations frequently do not need another enormous platform. They need smaller, precise
          pieces of software that connect what already exists.
        </p>
        <p>
          Large systems solve large categories of problems. PIXDRIFT solves the overlooked ones.
        </p>
        <p className="text-muted">
          The name derives from <span className="font-mono text-ink">pixel + drift</span>. A pixel
          is the smallest meaningful unit of a much larger picture. Reduce a complex organization
          into its individual components and the major systems are already there — what remains are
          the small pieces between them: missing connections, fragmented information, overlooked
          processes, handovers and exceptions.
        </p>
        <p>
          Individually those pieces appear insignificant. Collectively they determine whether the
          larger environment actually works.
        </p>
      </div>

      <hr className="pd-hr my-16" />

      <p className="max-w-2xl text-3xl font-semibold leading-snug tracking-tight text-ink">
        Small pieces matter — because the reliability of a larger environment often depends on what
        happens between its major components.
      </p>
    </Container>
  );
}
