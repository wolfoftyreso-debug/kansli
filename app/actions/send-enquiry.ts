"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { escapeHtml, parseContactFields } from "@/lib/contact";
import { allowRequest } from "@/lib/rate-limit";
import { site } from "@/lib/site";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
};

function enquiryHtml(fields: {
  name: string;
  organisation: string;
  email: string;
  process: string;
}) {
  const name = escapeHtml(fields.name);
  const organisation = escapeHtml(fields.organisation);
  const email = escapeHtml(fields.email);
  const process = escapeHtml(fields.process).replaceAll("\n", "<br />");

  return `<div style="background:#f7f8f9;padding:32px 16px">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e3e6e8;padding:32px">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#007580">Landvex enquiry</p>
    <h1 style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:#000028">New technical review request</h1>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#000028"><strong>Name</strong><br />${name}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#000028"><strong>Organisation</strong><br />${organisation}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#000028"><strong>Email</strong><br /><a href="mailto:${email}">${email}</a></p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#000028"><strong>Process</strong><br />${process}</p>
  </div>
</div>`;
}

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

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `Enquiry from ${organisation}`,
      html: enquiryHtml({
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
  } catch (error) {
    console.error("sendEnquiry: unexpected send failure", error);
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
