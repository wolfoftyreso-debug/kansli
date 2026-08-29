import Link from "next/link";
import { mcpSystemMatrix } from "@/lib/mcp/catalog";
import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicShareMeta } from "@/lib/platform/canonical";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.mcp.systems.metaTitle"),
    ...publicShareMeta("/documentation/mcp/systems"),
  };
}

export default async function McpSystemsPage() {
  const locale = await readLocale();
  const rows = mcpSystemMatrix();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/systems" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.systems")}
          title={t(locale, "site.doc.mcp.systems.title")}
          intro={t(locale, "site.doc.mcp.systems.intro")}
        />
      </div>
      <table className="mt-12 w-full border-t border-line text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="py-3 font-medium">{t(locale, "site.doc.systems")}</th>
            <th className="py-3 font-medium">{t(locale, "site.catalog.spec.mcp")}</th>
            <th className="py-3 font-medium">{t(locale, "site.doc.nav.tools")}</th>
            <th className="py-3 font-medium">{t(locale, "site.catalog.spec.status")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="py-3">
                <Link href={`/systems/${row.id}`} className="hover:underline">
                  {row.name}
                </Link>
              </td>
              <td className="py-3">
                {row.mcp
                  ? t(locale, "site.catalog.spec.available")
                  : t(locale, "site.catalog.spec.notExposed")}
              </td>
              <td className="py-3">{row.tools}</td>
              <td className="py-3">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}
