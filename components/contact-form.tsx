"use client";

import { useActionState } from "react";
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

export function ContactForm() {
  const [state, action, pending] = useActionState(sendEnquiry, initialState);

  if (state.status === "success") {
    return (
      <div className="border border-line bg-white p-10" role="status" aria-live="polite">
        <h2 className="mt-0 mb-3 text-[21px] font-semibold">Enquiry sent.</h2>
        <p className="m-0 text-[15px] leading-[1.65] text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="relative border border-line bg-white p-10" noValidate>
      <div className="grid gap-[22px]">
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Name <span className="sr-only">(required)</span>
          </span>
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
          <FieldError id="name-error" message={state.errors?.name} />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Organisation <span className="sr-only">(required)</span>
          </span>
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
          <FieldError id="organisation-error" message={state.errors?.organisation} />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Work email <span className="sr-only">(required)</span>
          </span>
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
          <FieldError id="email-error" message={state.errors?.email} />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            The process you want automated <span className="sr-only">(required)</span>
          </span>
          <textarea
            className="input min-h-[120px] resize-y"
            name="process"
            rows={4}
            required
            minLength={CONTACT_LIMITS.process.min}
            maxLength={CONTACT_LIMITS.process.max}
            defaultValue={state.values?.process}
            aria-invalid={state.errors?.process ? true : undefined}
            aria-describedby={state.errors?.process ? "process-error" : undefined}
          />
          <FieldError id="process-error" message={state.errors?.process} />
        </label>
        <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {state.status === "error" && !(state.errors && Object.keys(state.errors).length) ? (
          <p className="m-0 text-sm text-danger" role="alert">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="min-h-11 justify-self-start border-0 bg-navy px-[26px] py-4 font-sans text-[15px] font-semibold text-white hover:bg-teal disabled:cursor-wait disabled:opacity-70"
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
