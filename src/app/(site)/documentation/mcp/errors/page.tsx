import { McpDocNav } from "@/components/site/McpDocNav";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { publicShareMeta } from "@/lib/platform/canonical";

export async function generateMetadata() {
  const locale = await readLocale();
  return {
    title: t(locale, "site.doc.mcp.errors.metaTitle"),
    ...publicShareMeta("/documentation/mcp/errors"),
  };
}

const ERRORS = [
  ["AUTHENTICATION_REQUIRED", "Missing or invalid token."],
  ["PERMISSION_DENIED", "Logged in, but this tool is not allowed."],
  ["TENANT_SCOPE_VIOLATION", "A tenant_id or orgRef was sent in the tool arguments."],
  ["VALIDATION_ERROR", "Input did not match the tool schema."],
  ["NOT_FOUND", "Unknown tool or resource."],
  ["RATE_LIMITED", "Too many calls in this isolate window."],
  ["APPROVAL_REQUIRED", "Level 4 action. A person must approve. None are shipped yet."],
  ["DEPENDENCY_UNAVAILABLE", "Database or downstream service is down."],
  ["INTERNAL_ERROR", "Unexpected failure. Details stay in logs."],
] as const;

export default async function McpErrorsPage() {
  const locale = await readLocale();
  return (
    <Container>
      <McpDocNav current="/documentation/mcp/errors" />
      <div className="mt-10">
        <SectionHeading
          as="h1"
          eyebrow={t(locale, "site.doc.nav.errors")}
          title={t(locale, "site.doc.mcp.errors.title")}
          intro={t(locale, "site.doc.mcp.errors.intro")}
        />
      </div>
      <dl className="mt-12 border-t border-line">
        {ERRORS.map(([name, text]) => (
          <div key={name} className="grid gap-2 border-b border-line py-5 md:grid-cols-[18rem_1fr]">
            <dt className="font-mono text-sm">{name}</dt>
            <dd className="text-ink-soft">{text}</dd>
          </div>
        ))}
      </dl>
    </Container>
  );
}
