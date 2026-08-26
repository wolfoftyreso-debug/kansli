import { brand } from "./brand.ts";
import {
  escapeHtml,
  oneLine,
  parseContactFields,
  type ContactFields,
  type ContactValues,
  type FieldErrors,
} from "./contact.ts";
import { isCompanyFromAddress, type MailEnv } from "./env.ts";
import { allowRequest } from "./rate-limit.ts";
import { site } from "./site.ts";

export type EnquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: FieldErrors;
  values?: ContactValues;
};

export type MailMessage = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
};

export type MailResult = {
  accepted: boolean;
  error?: string;
};

export type Mailer = {
  send: (message: MailMessage) => Promise<MailResult>;
};

const PUBLIC_FAILURE = `We could not send that just now. Please email ${site.email}.`;

function enquiryHtml(fields: ContactValues) {
  const name = escapeHtml(fields.name);
  const organisation = escapeHtml(fields.organisation);
  const email = escapeHtml(fields.email);
  const brief = escapeHtml(fields.brief).replaceAll("\n", "<br />");

  return `<div style="background:${brand.wash};padding:32px 16px">
  <div style="max-width:640px;margin:0 auto;background:${brand.white};border:1px solid ${brand.line};padding:32px">
    <p style="margin:0 0 8px;font-family:ui-monospace,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:${brand.teal}">Landvex enquiry</p>
    <h1 style="margin:0 0 24px;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:600;color:${brand.navy}">New enquiry</h1>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${brand.navy}"><strong>Name</strong><br />${name}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${brand.navy}"><strong>Organisation</strong><br />${organisation}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${brand.navy}"><strong>Email</strong><br />${email}</p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${brand.navy}"><strong>What they need</strong><br />${brief}</p>
  </div>
</div>`;
}

export async function handleEnquiry(
  input: ContactFields,
  ctx: {
    mailer: Mailer;
    env: MailEnv;
    clientKey: string;
    now?: number;
    log?: (event: string, detail?: Record<string, string>) => void;
  },
): Promise<EnquiryState> {
  const now = ctx.now ?? Date.now();
  const log = ctx.log ?? (() => undefined);
  const parsed = parseContactFields(input);

  if (!parsed.ok) {
    return {
      status: "error",
      message: parsed.error,
      errors: parsed.errors,
      values: parsed.values,
    };
  }

  if (parsed.spam) {
    log("enquiry_discarded");
    return {
      status: "success",
      message: "Thanks. A founder will reply to this address.",
    };
  }

  const emailKey = `email:${parsed.data.email}`;
  if (
    !allowRequest(ctx.clientKey, 5, 60 * 60 * 1000, now) ||
    !allowRequest(emailKey, 3, 60 * 60 * 1000, now)
  ) {
    log("enquiry_throttled");
    return {
      status: "error",
      message: "Please wait before sending another enquiry.",
      values: parsed.data,
    };
  }

  if (!ctx.env.apiKey) {
    log("enquiry_unconfigured", { reason: "missing_api_key" });
    return { status: "error", message: PUBLIC_FAILURE, values: parsed.data };
  }

  if (!ctx.env.from) {
    log("enquiry_unconfigured", { reason: "missing_from" });
    return { status: "error", message: PUBLIC_FAILURE, values: parsed.data };
  }

  if (ctx.env.production && !isCompanyFromAddress(ctx.env.from)) {
    log("enquiry_unconfigured", { reason: "from_not_company_domain" });
    return { status: "error", message: PUBLIC_FAILURE, values: parsed.data };
  }

  const { name, organisation, email, brief } = parsed.data;
  const subjectOrg = oneLine(organisation, 80);

  try {
    const result = await ctx.mailer.send({
      from: ctx.env.from,
      to: ctx.env.to,
      replyTo: email,
      subject: `Enquiry from ${subjectOrg}`,
      html: enquiryHtml({ name, organisation, email, brief }),
      text: [
        `Name: ${name}`,
        `Organisation: ${organisation}`,
        `Email: ${email}`,
        "",
        brief,
      ].join("\n"),
    });

    if (!result.accepted) {
      log("enquiry_rejected", result.error ? { reason: result.error } : undefined);
      return { status: "error", message: PUBLIC_FAILURE, values: parsed.data };
    }
  } catch (error) {
    log("enquiry_failed", {
      reason: error instanceof Error ? error.name : "unknown",
    });
    return { status: "error", message: PUBLIC_FAILURE, values: parsed.data };
  }

  log("enquiry_accepted");
  return {
    status: "success",
    message: "Thanks. A founder will reply to this address.",
  };
}
