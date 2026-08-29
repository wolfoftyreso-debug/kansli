import Link from "next/link";
import { listOpenApiOperations } from "@/lib/platform/openapi";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicCanonical } from "@/lib/platform/canonical";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.rest.metaTitle"),
    description: t(locale, "site.doc.rest.metaDescription"),
    alternates: { canonical: publicCanonical("/documentation/rest") },
  };
}

export default async function RestDocumentationPage() {
  const locale = await readLocale();
  const operations = listOpenApiOperations();
  return (
    <Container>
      <McpDocNav current="/documentation/rest" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.rest")}
          title={t(locale, "site.doc.rest.title")}
          intro={t(locale, "site.doc.rest.intro")}
        />
      </div>
      <p className="mt-8 text-sm text-muted">
        {t(locale, "site.doc.rest.operations", { count: operations.length })}{" "}
        <Link href="/api/platform/openapi" className="underline decoration-line underline-offset-4">
          /api/platform/openapi
        </Link>
      </p>
      <div className="mt-12 flex flex-col border-t border-line">
        {operations.map((operation) => (
          <article
            key={operation.capabilityId}
            id={operation.capabilityId}
            className="border-b border-line py-8"
          >
            <p className="pd-label">
              {operation.product} · {operation.permission ?? "org read"}
            </p>
            <h2 className="mt-2 font-mono text-lg font-medium">{operation.capabilityId}</h2>
            <p className="mt-2 font-mono text-sm text-ink">
              {operation.method} {operation.openApiPath}
            </p>
            <p className="mt-2 max-w-2xl whitespace-pre-line text-ink-soft">
              {operation.description}
            </p>
            {operation.event ? (
              <p className="mt-3 text-sm text-muted">
                {t(locale, "site.doc.rest.event", { name: operation.event })}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </Container>
  );
}
