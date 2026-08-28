"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { Resend } from "resend";
import { handleEnquiry, type EnquiryState, type Mailer } from "@/lib/enquiry";
import { mailEnv } from "@/lib/env";

export type { EnquiryState };

// Assumes a single trusted proxy in front (ALB, App Runner, CloudFront), which
// appends the real client IP. Exposed directly, the leftmost value is caller
// controlled and the throttle becomes advisory. It is one layer of several,
// never the only one.
function clientKey(headerStore: Headers) {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

function resendMailer(apiKey: string): Mailer {
  const resend = new Resend(apiKey);
  return {
    async send(message) {
      const { error } = await resend.emails.send({
        from: message.from,
        to: message.to,
        replyTo: message.replyTo,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
      return { accepted: !error, error: error?.name };
    },
  };
}

export async function sendEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const env = mailEnv();
  const headerStore = await headers();
  const requestId = randomUUID();

  return handleEnquiry(
    {
      name: formData.get("name"),
      organisation: formData.get("organisation"),
      email: formData.get("email"),
      brief: formData.get("brief"),
      website: formData.get("website"),
    },
    {
      mailer: env.apiKey ? resendMailer(env.apiKey) : { send: async () => ({ accepted: false }) },
      env,
      clientKey: clientKey(headerStore),
      log: (event, detail) => {
        if (event === "enquiry_accepted" || event === "enquiry_discarded") return;
        console.error(JSON.stringify({ src: "enquiry", event, requestId, ...detail }));
      },
    },
  );
}
