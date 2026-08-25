import type { HTMLAttributes } from "react";
import { cn } from "./cn.ts";

export function Card({
  className,
  pad = "md",
  ...rest
}: HTMLAttributes<HTMLDivElement> & {
  pad?: "sm" | "md" | "lg";
}) {
  const padding = pad === "sm" ? "p-4" : pad === "lg" ? "p-6" : "p-5";
  return (
    <div
      className={cn(
        "rounded-[var(--tyra-radius)] border border-[var(--tyra-border)] bg-[var(--tyra-surface)]",
        padding,
        className,
      )}
      {...rest}
    />
  );
}
