import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn.ts";
import { StatusBadge, type StatusTone } from "./Status.tsx";

export function FieldRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <div className="text-xs font-medium text-[var(--tyra-muted)]">{props.label}</div>
      <div className="text-sm text-[var(--tyra-fg)]">{props.value}</div>
    </div>
  );
}

export function TaskRow({
  className,
  headline,
  subtitle,
  status,
  right,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  headline: ReactNode;
  subtitle?: ReactNode;
  status?: { tone: StatusTone; label: string } | null;
  right?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--tyra-radius)] border border-[var(--tyra-border)] bg-[var(--tyra-surface)] px-5 py-4",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold tracking-tight">{headline}</div>
          {subtitle ? (
            <div className="mt-1 text-sm text-[var(--tyra-muted)]">{subtitle}</div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {status ? <StatusBadge tone={status.tone} label={status.label} /> : null}
          {right}
        </div>
      </div>
    </div>
  );
}
