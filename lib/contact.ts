export const CONTACT_LIMITS = {
  name: { min: 2, max: 120 },
  organisation: { min: 2, max: 160 },
  email: { max: 254 },
  process: { min: 8, max: 4000 },
} as const;

const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f\u2028\u2029]/;

export type ContactFields = {
  name: unknown;
  organisation: unknown;
  email: unknown;
  process: unknown;
  website?: unknown;
};

export type ContactValues = {
  name: string;
  organisation: string;
  email: string;
  process: string;
};

export type FieldErrors = Partial<Record<keyof ContactValues, string>>;

export type ParsedContact =
  | { ok: true; spam: true }
  | { ok: true; spam: false; data: ContactValues }
  | { ok: false; error: string; errors?: FieldErrors; values: ContactValues };

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readField(value: unknown, max: number) {
  const trimmed = asString(value).trim();
  if (CONTROL_CHARS.test(trimmed) || trimmed.length > max) return null;
  return trimmed;
}

function readEmail(value: unknown) {
  const trimmed = asString(value).trim().toLowerCase();
  if (!trimmed || trimmed.length > CONTACT_LIMITS.email.max) return null;
  if (CONTROL_CHARS.test(trimmed) || /\s/.test(trimmed)) return null;
  if (trimmed.includes("..") || trimmed.includes("@@")) return null;
  if (!EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function parseContactFields(input: ContactFields): ParsedContact {
  const values: ContactValues = {
    name: asString(input.name).trim(),
    organisation: asString(input.organisation).trim(),
    process: asString(input.process).trim(),
    email: asString(input.email).trim(),
  };

  if (asString(input.website).trim()) {
    return { ok: true, spam: true };
  }

  const name = readField(input.name, CONTACT_LIMITS.name.max);
  const organisation = readField(input.organisation, CONTACT_LIMITS.organisation.max);
  const process = readField(input.process, CONTACT_LIMITS.process.max);
  const email = readEmail(input.email);

  const errors: FieldErrors = {};
  if (!name || name.length < CONTACT_LIMITS.name.min) {
    errors.name = "Please add your name.";
  }
  if (!organisation || organisation.length < CONTACT_LIMITS.organisation.min) {
    errors.organisation = "Please add your organisation.";
  }
  if (!email) {
    errors.email = "Please add a valid work email.";
  }
  if (!process || process.length < CONTACT_LIMITS.process.min) {
    errors.process = "Please describe where the work sits between your systems.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      errors,
      values,
    };
  }

  if (!name || !organisation || !email || !process) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      values,
    };
  }

  return {
    ok: true,
    spam: false,
    data: { name, organisation, email, process },
  };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function oneLine(value: string, max: number) {
  return value.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
