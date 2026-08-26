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
    <section className="border border-line bg-surface px-4 py-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-ink-soft">{children}</div>
      <a
        href={`/api/auth/login?next=${encodeURIComponent(next)}`}
        className="mt-4 inline-flex bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
      >
        Logga in
      </a>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted">{children}</p>;
}

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warn" | "alarm";
}) {
  const cls =
    tone === "alarm"
      ? "pd-banner-blocked px-3 py-3 text-sm"
      : tone === "warn"
        ? "border border-line bg-surface px-3 py-3 text-sm text-[var(--color-status-development)]"
        : "border border-line bg-accent-soft px-3 py-2 text-sm text-ink-soft";
  return <p className={cls}>{children}</p>;
}

export function Field({
  name,
  label,
  required,
  defaultValue,
  placeholder,
  multiline,
  large,
  type = "text",
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
  multiline?: boolean;
  large?: boolean;
  type?: "text" | "email" | "tel";
}) {
  const cls = large
    ? "min-h-12 border border-line bg-paper px-4 py-3 text-base"
    : "border border-line bg-paper px-3 py-2 text-sm";
  const mark = required ? " *" : "";
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-ink-soft">
        {label}
        {mark}
      </span>
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
          type={type}
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
  value = "on",
  required,
  large,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  value?: string;
  required?: boolean;
  large?: boolean;
}) {
  return (
    <label
      className={
        large
          ? "flex min-h-12 items-center gap-3 text-base text-ink-soft"
          : "flex items-start gap-2 text-sm text-ink-soft"
      }
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required={required}
        className={large ? "h-5 w-5 shrink-0" : "mt-1"}
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
          ? "min-h-12 w-full bg-ink px-4 py-3 text-base font-medium text-paper hover:bg-ink-soft"
          : "self-start bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
      }
    >
      {children}
    </button>
  );
}
