import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { SystemCard } from "@/components/site/SystemCard";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicShareMeta } from "@/lib/platform/canonical";
import { systems } from "@/lib/pixdrift/systems";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.systems.metaTitle"),
    description: t(locale, "site.systems.metaDescription"),
    ...publicShareMeta("/systems"),
  };
}

export default async function SystemsPage() {
  const locale = await readLocale();
  return (
    <Container>
      <SectionHeading
        as="h1"
        eyebrow={t(locale, "site.systems.eyebrow")}
        title={t(locale, "site.systems.title")}
        intro={t(locale, "site.systems.intro")}
      />
      <div className="mt-14 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        {systems.map((s) => (
          <SystemCard key={s.slug} system={s} locale={locale} />
        ))}
      </div>
    </Container>
  );
}
