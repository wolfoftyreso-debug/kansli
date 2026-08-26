"use client";

import { useActionState } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions/send-enquiry";
import { CONTACT_LIMITS } from "@/lib/contact";

const initialState: EnquiryState = { status: "idle" };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendEnquiry, initialState);

  if (state.status === "success") {
    return (
      <div
        className="border border-line bg-white p-10"
        role="status"
        aria-live="polite"
      >
        <h3 className="mt-0 mb-3 text-[21px] font-semibold">Enquiry sent.</h3>
        <p className="m-0 text-[15px] leading-[1.65] text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="relative border border-line bg-white p-10">
      <div className="grid gap-[22px]">
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">Name</span>
          <input
            className="input"
            type="text"
            name="name"
            autoComplete="name"
            required
            maxLength={CONTACT_LIMITS.name}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Organisation
          </span>
          <input
            className="input"
            type="text"
            name="organisation"
            autoComplete="organization"
            required
            maxLength={CONTACT_LIMITS.organisation}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            Work email
          </span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={CONTACT_LIMITS.email}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-[13px] font-semibold tracking-[0.02em]">
            The process you want automated
          </span>
          <textarea
            className="input resize-y"
            name="process"
            rows={4}
            required
            maxLength={CONTACT_LIMITS.process}
          />
        </label>
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        {state.status === "error" ? (
          <p className="m-0 text-sm text-[#9b1c1c]" role="alert">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="justify-self-start border-0 bg-navy px-[26px] py-4 font-sans text-[15px] font-semibold text-white hover:bg-teal disabled:cursor-wait disabled:opacity-70"
        >
          {pending ? "Sending…" : "Send enquiry"}
        </button>
        <p className="m-0 text-[13px] text-subtle">
          We don&apos;t spam. Your information stays private. See our{" "}
          <a href="/privacy">privacy policy</a>.
        </p>
      </div>
    </form>
  );
}
