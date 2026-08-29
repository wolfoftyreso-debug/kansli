import Link from "next/link";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n/request";
import { MCP_DOC_LINKS } from "@/lib/mcp/catalog";

export async function McpDocNav({ current }: { current: string }) {
  const locale = await readLocale();
  return (
    <nav aria-label={t(locale, "site.catalog.spec.mcp")} className="flex flex-wrap gap-3 text-sm">
      {MCP_DOC_LINKS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            item.href === current
              ? "font-medium text-ink"
              : "text-ink-soft underline decoration-line underline-offset-4 hover:text-ink"
          }
          aria-current={item.href === current ? "page" : undefined}
        >
          {t(locale, item.key)}
        </Link>
      ))}
    </nav>
  );
}
