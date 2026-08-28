import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { mcpCatalog } from "@/lib/mcp/handle";
import { McpExplorer } from "./Explorer";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "mcp.metaTitle") };
}

export default async function PlatformMcpPage() {
  const session = await readSession();
  const locale = await readLocale();
  const catalog = mcpCatalog();
  return (
    <AppShell current="platform" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/platform", label: t(locale, "service.platform") },
          { href: "/platform/mcp", label: "MCP" },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">MCP</h1>
        <p className="max-w-xl text-ink-soft">{t(locale, "mcp.lead")}</p>
      </header>
      {!session ? (
        <SignInGate next="/platform/mcp" title={t(locale, "mcp.signInTitle")}>
          {t(locale, "mcp.signInBody")}
        </SignInGate>
      ) : (
        <>
          <p className="text-sm text-muted">
            {t(locale, "mcp.toolCount", { count: catalog.tools.length })}
          </p>
          <McpExplorer locale={locale} />
        </>
      )}
    </AppShell>
  );
}
