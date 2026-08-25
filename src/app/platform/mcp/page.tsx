import { AppShell } from "@/components/app/AppShell";
import { ProductCrumb } from "@/components/app/ProductCrumb";
import { SignInGate } from "@/components/app/SignInGate";
import { readSession } from "@/lib/auth/session";
import { mcpCatalog } from "@/lib/mcp/handle";
import { McpExplorer } from "./Explorer";

export const dynamic = "force-dynamic";
export const metadata = { title: "MCP — Pixdrift" };

export default async function PlatformMcpPage() {
  const session = await readSession();
  const catalog = mcpCatalog();
  return (
    <AppShell current="platform" session={session}>
      <ProductCrumb
        crumbs={[
          { href: "/platform", label: "Plattform" },
          { href: "/platform/mcp", label: "MCP" },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">MCP</h1>
        <p className="max-w-xl text-ink-soft">
          Samma inloggning som resten. Här kan du prova läsverktyg mot den här miljön — inte mot
          produktion utifrån.
        </p>
      </header>
      {!session ? (
        <SignInGate next="/platform/mcp" title="Logga in för att prova MCP">
          Verktygen använder din Pixdrift-session.
        </SignInGate>
      ) : (
        <>
          <p className="text-sm text-muted">{catalog.tools.length} verktyg i registret.</p>
          <McpExplorer />
        </>
      )}
    </AppShell>
  );
}
