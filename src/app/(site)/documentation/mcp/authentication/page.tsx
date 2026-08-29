import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicShareMeta } from "@/lib/platform/canonical";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.mcp.authPage.metaTitle"),
    description: t(locale, "site.doc.mcp.authPage.intro"),
    ...publicShareMeta("/documentation/mcp/authentication"),
  };
}

export default async function McpAuthPage() {
  const locale = await readLocale();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/authentication" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.nav.auth")}
          title={t(locale, "site.doc.mcp.authPage.title")}
          intro={t(locale, "site.doc.mcp.authPage.intro")}
        />
      </div>
      <ol className="mt-10 max-w-2xl list-decimal space-y-4 pl-5 text-ink-soft">
        <li>
          Get an access token from PIXDRIFT Identity (authorization code + PKCE, same as Kansli).
        </li>
        <li>
          Call <span className="font-mono text-ink">POST /mcp</span> with{" "}
          <span className="font-mono text-ink">
            Authorization: Bearer ${"{PIXDRIFT_MCP_TOKEN}"}
          </span>
          .
        </li>
        <li>
          Tenant and permissions come from the token. Tool arguments cannot switch organisation.
        </li>
      </ol>
      <p className="mt-8 max-w-2xl text-sm text-muted">
        Audience is the Kansli client (kansli-web). Revoke access by revoking the IdP client or
        ending the session. Do not put tokens in documentation, screenshots, or client-side source.
      </p>
    </Container>
  );
}
