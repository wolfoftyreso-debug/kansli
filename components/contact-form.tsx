"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { sendEnquiry, type EnquiryState } from "@/app/actions/send-enquiry";
import { CONTACT_LIMITS } from "@/lib/contact";

const initialState: EnquiryState = { status: "idle" };

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="m-0 text-sm text-danger" role="alert">
      {message}
    </p>
  );
}

function Field({
  label,
  hint,
  hintId,
  errorId,
  error,
  children,
}: {
  label: string;
  hint?: string;
  hintId?: string;
  errorId: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-[13px] font-semibold tracking-[0.02em]">
        {label} <span className="sr-only">(required)</span>
      </span>
      {hint ? (
        <span id={hintId} className="text-[13px] leading-[1.55] text-subtle">
          {hint}
        </span>
      ) : null}
      {children}
      <FieldError id={errorId} message={error} />
    </label>
  );
}

export function ContactForm() {
  const [state, action, pending] = useActionState(sendEnquiry, initialState);
  const form = useRef<HTMLFormElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);

  // Submitting moves focus nowhere on its own: on success the button under the
  // cursor unmounts and focus falls to <body>; on a validation error the
  // problem may sit above the fold. Both cases get an explicit landing spot.
  useEffect(() => {
    if (state.status === "success") {
      confirmation.current?.focus();
      return;
    }
    if (state.status !== "error") return;
    const invalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (invalid ?? form.current?.querySelector<HTMLElement>('[role="alert"]'))?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        ref={confirmation}
        tabIndex={-1}
        className="border border-line bg-white p-10 outline-none"
        role="status"
      >
        <h2 className="title-md mt-0 mb-3">Enquiry sent.</h2>
        <p className="m-0 mb-4 text-[15px] leading-[1.65] text-muted">{state.message}</p>
        <p className="m-0 text-[15px] leading-[1.65] text-muted">
          While you wait, the <Link href="/methodology">methodology</Link> covers the
          ground a first call walks through.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={form}
      action={action}
      className="relative border border-line bg-white p-10"
      noValidate
    >
      <div className="grid gap-[22px]">
        <Field label="Name" errorId="name-error" error={state.errors?.name}>
          <input
            className="input"
            type="text"
            name="name"
            autoComplete="name"
            required
            minLength={CONTACT_LIMITS.name.min}
            maxLength={CONTACT_LIMITS.name.max}
            defaultValue={state.values?.name}
            aria-invalid={state.errors?.name ? true : undefined}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
        </Field>
        <Field
          label="Organisation"
          errorId="organisation-error"
          error={state.errors?.organisation}
        >
          <input
            className="input"
            type="text"
            name="organisation"
            autoComplete="organization"
            required
            minLength={CONTACT_LIMITS.organisation.min}
            maxLength={CONTACT_LIMITS.organisation.max}
            defaultValue={state.values?.organisation}
            aria-invalid={state.errors?.organisation ? true : undefined}
            aria-describedby={state.errors?.organisation ? "organisation-error" : undefined}
          />
        </Field>
        <Field label="Work email" errorId="email-error" error={state.errors?.email}>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={CONTACT_LIMITS.email.max}
            defaultValue={state.values?.email}
            aria-invalid={state.errors?.email ? true : undefined}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
        </Field>
        <Field
          label="What you need"
          hint="A system to license, or a gap between the platforms you run. How the work happens today is the useful part."
          hintId="brief-hint"
          errorId="brief-error"
          error={state.errors?.brief}
        >
          <textarea
            className="input min-h-[120px] resize-y"
            name="brief"
            rows={4}
            required
            minLength={CONTACT_LIMITS.brief.min}
            maxLength={CONTACT_LIMITS.brief.max}
            defaultValue={state.values?.brief}
            aria-invalid={state.errors?.brief ? true : undefined}
            aria-describedby={
              state.errors?.brief ? "brief-hint brief-error" : "brief-hint"
            }
          />
        </Field>
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {state.status === "error" && !(state.errors && Object.keys(state.errors).length) ? (
          <p className="m-0 text-sm text-danger outline-none" role="alert" tabIndex={-1}>
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="btn btn-primary justify-self-start border-0"
        >
          {pending ? "Sending…" : "Send enquiry"}
        </button>
        <p className="m-0 text-[13px] leading-[1.55] text-subtle">
          All fields are required. We use them only to reply to this enquiry. See{" "}
          <Link href="/privacy">how we handle it</Link>.
        </p>
      </div>
    </form>
  );
}
