import Link from "next/link";
import { MCP_PROTOCOL_VERSION } from "@pixdrift/mcp-core";
import { mcpCatalog } from "@/lib/mcp/handle";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.mcp.metaTitle"),
    description: t(locale, "site.doc.mcp.metaDescription"),
  };
}

export default async function McpOverviewPage() {
  const locale = await readLocale();
  const catalog = mcpCatalog();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.catalog.spec.mcp")}
          title={t(locale, "site.doc.mcp.title")}
          intro={t(locale, "site.doc.mcp.intro")}
        />
      </div>
      <dl className="mt-12 grid gap-6 border-t border-line pt-8 sm:grid-cols-2">
        <div>
          <dt className="pd-label">{t(locale, "site.doc.mcp.endpoint")}</dt>
          <dd className="mt-2 font-mono text-sm">POST /mcp</dd>
        </div>
        <div>
          <dt className="pd-label">{t(locale, "site.doc.mcp.protocol")}</dt>
          <dd className="mt-2 font-mono text-sm">{MCP_PROTOCOL_VERSION}</dd>
        </div>
        <div>
          <dt className="pd-label">{t(locale, "site.doc.nav.tools")}</dt>
          <dd className="mt-2">
            {t(locale, "site.doc.mcp.toolsCount", { count: catalog.tools.length })}
          </dd>
        </div>
        <div>
          <dt className="pd-label">{t(locale, "site.doc.mcp.auth")}</dt>
          <dd className="mt-2">{t(locale, "site.doc.mcp.authValue")}</dd>
        </div>
      </dl>
      <p className="mt-10 max-w-2xl text-ink-soft">
        {t(locale, "site.doc.mcp.exampleBefore")}{" "}
        <span className="font-mono">create_office_task</span> {t(locale, "site.doc.mcp.exampleOr")}{" "}
        <span className="font-mono">POST /api/kansli/tasks</span>.{" "}
        {t(locale, "site.doc.mcp.exampleBoth")} <span className="font-mono">addTask</span>.
      </p>
      <p className="mt-6">
        <Link
          href="/documentation/mcp/tools"
          className="underline decoration-line underline-offset-4"
        >
          {t(locale, "site.doc.mcp.toolCatalog")}
        </Link>
        {" · "}
        <Link href="/documentation/rest" className="underline decoration-line underline-offset-4">
          {t(locale, "site.doc.rest")}
        </Link>
        {" · "}
        <Link href="/platform/mcp" className="underline decoration-line underline-offset-4">
          {t(locale, "site.doc.mcp.explorer")}
        </Link>
        {" · "}
        <Link href="/api/mcp/health" className="underline decoration-line underline-offset-4">
          {t(locale, "site.doc.mcp.health")}
        </Link>
      </p>
    </Container>
  );
}
