import Link from "next/link";
import { MCP_DOC_LINKS } from "@/lib/mcp/catalog";

export function McpDocNav({ current }: { current: string }) {
  return (
    <nav aria-label="MCP" className="flex flex-wrap gap-3 text-sm">
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
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
