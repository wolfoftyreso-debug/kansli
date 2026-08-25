import Link from "next/link";
import type { OpportunityView } from "@pixdrift/tora";
import { displayField, opportunityHref, verdictText } from "@/lib/tora/view";

export function OpportunityCard({ item }: { item: OpportunityView }) {
  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-accent">{verdictText(item.verdict)}</p>
        <p className="font-mono text-xs text-faint">{item.scoreBand}</p>
      </div>
      <p className="mt-2 font-medium">
        <Link href={opportunityHref(item)} className="hover:underline">
          {displayField(item.title)}
        </Link>
      </p>
      <p className="mt-1 text-sm text-ink-soft">{displayField(item.organizationName)}</p>
      <p className="mt-2 text-sm text-muted">{displayField(item.rationale)}</p>
    </li>
  );
}
