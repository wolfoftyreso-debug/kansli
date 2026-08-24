import type { ReactNode } from "react";
import type { AppNextPath } from "@/lib/auth/next";

export function SignInGate({
  next,
  title,
  children,
}: {
  next: AppNextPath;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface px-5 py-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-ink-soft">{children}</div>
      <a
        href={`/api/auth/login?next=${encodeURIComponent(next)}`}
        className="mt-4 inline-flex rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
      >
        Logga in med Pixdrift
      </a>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft">
      {children}
    </p>
  );
}

export function Field({
  name,
  label,
  required,
  defaultValue,
  placeholder,
  multiline,
  large,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  large?: boolean;
}) {
  const cls = large
    ? "min-h-12 rounded-lg border border-line bg-paper px-4 py-3 text-base"
    : "rounded-md border border-line bg-paper px-3 py-2 text-sm";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-ink-soft">{label}</span>
      {multiline ? (
        <textarea
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={3}
          className={cls}
        />
      ) : (
        <input
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

export function CheckField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-ink-soft">
      <input
        type="checkbox"
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        className="mt-1"
      />
      <span>{label}</span>
    </label>
  );
}

export function Submit({ children, large }: { children: ReactNode; large?: boolean }) {
  return (
    <button
      type="submit"
      className={
        large
          ? "min-h-12 w-full rounded-lg bg-ink px-4 py-3 text-base font-medium text-paper hover:bg-ink-soft"
          : "self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
      }
    >
      {children}
    </button>
  );
}
