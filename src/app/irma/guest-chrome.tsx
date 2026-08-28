import type { ReactNode } from "react";

export function GuestProgress({
  step,
  ariaLabel,
  labels,
}: {
  step: 1 | 2 | 3;
  ariaLabel: string;
  labels: readonly [string, string, string];
}) {
  return (
    <ol className="flex gap-1.5" aria-label={ariaLabel}>
      {labels.map((label, index) => {
        const n = (index + 1) as 1 | 2 | 3;
        const reached = n <= step;
        const current = n === step;
        return (
          <li key={label} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              className={
                reached ? "h-1.5 rounded-full bg-ink" : "h-1.5 rounded-full bg-line-strong"
              }
            />
            <span
              className={
                current
                  ? "text-xs font-semibold text-ink"
                  : reached
                    ? "text-xs font-medium text-ink"
                    : "text-xs text-faint"
              }
            >
              {n}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function GuestReceipt({
  signerName,
  signedAt,
  heading,
  lead,
}: {
  signerName: string;
  signedAt: string | null;
  heading: string;
  lead: string;
}) {
  return (
    <section className="flex flex-col items-center gap-5 rounded-2xl border border-line bg-surface px-5 py-10 text-center">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-2xl text-paper"
      >
        ✓
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
        <p className="text-base text-ink-soft">
          {signerName}
          {signedAt ? ` · ${signedAt}` : ""}
        </p>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{lead}</p>
    </section>
  );
}

export function GuestFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-paper text-ink">
      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-5 py-10 sm:px-6 sm:py-16">
        {children}
      </main>
    </div>
  );
}
