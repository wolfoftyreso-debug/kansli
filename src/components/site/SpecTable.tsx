import type { ReactNode } from "react";

export function SpecTable({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="border-t border-line">
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-1 gap-1 border-b border-line py-4 sm:grid-cols-[12rem_1fr] sm:gap-6"
        >
          <dt className="pd-label pt-0.5">{row.label}</dt>
          <dd className="text-ink">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
