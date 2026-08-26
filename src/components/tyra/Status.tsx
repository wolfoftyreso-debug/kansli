import type { HTMLAttributes } from "react";
import { cn } from "./cn.ts";

export type StatusTone = "good" | "attention" | "blocked" | "neutral";

function mark(tone: StatusTone) {
  if (tone === "good") return { cls: "text-[var(--color-status-operational)]", glyph: "✓" };
  if (tone === "attention") return { cls: "text-[var(--color-status-development)]", glyph: "◆" };
  if (tone === "blocked") return { cls: "text-[var(--color-status-blocked)]", glyph: "×" };
  return { cls: "text-[var(--color-status-waiting)]", glyph: "···" };
}

function bannerClass(tone: StatusTone) {
  if (tone === "blocked") return "pd-banner-blocked px-4 py-3";
  if (tone === "good") {
    return "border border-line bg-surface text-[var(--color-status-operational)]";
  }
  if (tone === "attention") {
    return "border border-line bg-surface text-[var(--color-status-development)]";
  }
  return "border border-line bg-[var(--tyra-surface)] text-[var(--tyra-fg)]";
}

export function StatusBadge(props: { tone: StatusTone; label: string; className?: string }) {
  const shape = mark(props.tone);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border border-[var(--tyra-border)] bg-[var(--tyra-surface)] px-3 py-1 text-xs font-medium text-[var(--tyra-fg)]",
        props.tone === "blocked" && "border-l-2 border-l-[var(--color-status-blocked)]",
        props.className,
      )}
    >
      <span className={cn("font-mono text-[0.7rem]", shape.cls)} aria-hidden>
        {shape.glyph}
      </span>
      <span>{props.label}</span>
    </span>
  );
}

export function StatusBanner({
  tone,
  title,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  tone: StatusTone;
  title?: string;
}) {
  return (
    <div className={cn("px-4 py-3", bannerClass(tone), className)} {...rest}>
      {title ? <div className="text-sm font-semibold">{title}</div> : null}
      {children ? (
        <div className={cn(title ? "mt-1 text-sm opacity-90" : "text-sm")}>{children}</div>
      ) : null}
    </div>
  );
}
