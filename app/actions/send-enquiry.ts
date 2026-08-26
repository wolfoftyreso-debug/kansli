"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { EnquiryEmail } from "@/components/enquiry-email";
import { parseContactFields } from "@/lib/contact";
import { allowRequest } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function sendEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const parsed = parseContactFields({
    name: String(formData.get("name") ?? ""),
    organisation: String(formData.get("organisation") ?? ""),
    email: String(formData.get("email") ?? ""),
    process: String(formData.get("process") ?? ""),
    website: String(formData.get("website") ?? ""),
  });

  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  if (parsed.spam) {
    return {
      status: "success",
      message: "Thanks. A founder will reply to this address.",
    };
  }

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";

  if (!allowRequest(ip, 5, 60 * 60 * 1000)) {
    return {
      status: "error",
      message: "Too many enquiries from this network. Email us directly instead.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("sendEnquiry: RESEND_API_KEY is not set");
    return {
      status: "error",
      message: "The form is not connected yet. Please email contact@landvex.com.",
    };
  }

  const from = process.env.CONTACT_FROM ?? "Landvex <onboarding@resend.dev>";
  const to = process.env.CONTACT_TO ?? site.email;
  const { name, organisation, email, process: processDescription } = parsed.data;
  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Enquiry from ${organisation}`,
    react: EnquiryEmail({
      name,
      organisation,
      email,
      process: processDescription,
    }),
    text: [
      `Name: ${name}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      "",
      processDescription,
    ].join("\n"),
  });

  if (error) {
    console.error("sendEnquiry: Resend rejected the send", error);
    return {
      status: "error",
      message: "We could not send that just now. Please email contact@landvex.com.",
    };
  }

  return {
    status: "success",
    message: "Thanks. A founder will reply to this address.",
  };
}
