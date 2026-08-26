export const CONTACT_LIMITS = {
  name: 120,
  organisation: 160,
  email: 254,
  process: 4000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFields = {
  name: string;
  organisation: string;
  email: string;
  process: string;
  website?: string;
};

export type ParsedContact =
  | { ok: true; spam: true }
  | {
      ok: true;
      spam: false;
      data: {
        name: string;
        organisation: string;
        email: string;
        process: string;
      };
    }
  | { ok: false; error: string };

function trimField(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export function parseContactFields(input: ContactFields): ParsedContact {
  if (input.website?.trim()) {
    return { ok: true, spam: true };
  }

  const name = trimField(input.name, CONTACT_LIMITS.name);
  const organisation = trimField(input.organisation, CONTACT_LIMITS.organisation);
  const email = trimField(input.email, CONTACT_LIMITS.email).toLowerCase();
  const process = trimField(input.process, CONTACT_LIMITS.process);

  if (!name) return { ok: false, error: "Please add your name." };
  if (!organisation) {
    return { ok: false, error: "Please add your organisation." };
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: "Please add a valid work email." };
  }
  if (!process) {
    return { ok: false, error: "Please describe the process you want automated." };
  }

  return { ok: true, spam: false, data: { name, organisation, email, process } };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
