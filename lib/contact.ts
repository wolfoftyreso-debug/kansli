export const CONTACT_LIMITS = {
  name: { min: 2, max: 120 },
  organisation: { min: 2, max: 160 },
  email: { max: 254 },
  brief: { min: 8, max: 4000 },
} as const;

const EMAIL_PATTERN = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const CONTROL_CHARS = /[\u0000-\u001f\u007f\u2028\u2029]/;
// Separate global copy: a /g regex carries lastIndex between .test() calls,
// so the two uses must not share one object.
const CONTROL_CHARS_GLOBAL = /[\u0000-\u001f\u007f\u2028\u2029]/g;

export type ContactFields = {
  name: unknown;
  organisation: unknown;
  email: unknown;
  brief: unknown;
  website?: unknown;
};

export type ContactValues = {
  name: string;
  organisation: string;
  email: string;
  brief: string;
};

export type FieldErrors = Partial<Record<keyof ContactValues, string>>;

export type ParsedContact =
  | { ok: true; spam: true; values: ContactValues }
  | { ok: true; spam: false; data: ContactValues }
  | { ok: false; error: string; errors?: FieldErrors; values: ContactValues };

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

type FieldRead = { ok: true; value: string } | { ok: false; reason: "invalid" | "long" };

function readField(value: unknown, max: number): FieldRead {
  const trimmed = asString(value).trim();
  if (trimmed.length > max) return { ok: false, reason: "long" };
  if (CONTROL_CHARS.test(trimmed)) return { ok: false, reason: "invalid" };
  return { ok: true, value: trimmed };
}

function readEmail(value: unknown) {
  const trimmed = asString(value).trim().toLowerCase();
  if (!trimmed || trimmed.length > CONTACT_LIMITS.email.max) return null;
  if (CONTROL_CHARS.test(trimmed) || /\s/.test(trimmed)) return null;
  if (trimmed.includes("..") || trimmed.includes("@@")) return null;
  if (!EMAIL_PATTERN.test(trimmed)) return null;
  return trimmed;
}

const FIELD_COPY = {
  name: {
    missing: "Please add your name.",
    long: `Please keep your name under ${CONTACT_LIMITS.name.max} characters.`,
  },
  organisation: {
    missing: "Please add your organisation.",
    long: `Please keep your organisation under ${CONTACT_LIMITS.organisation.max} characters.`,
  },
  email: { missing: "Please add a valid work email." },
  brief: {
    missing: "Please describe what you need, in a sentence or two.",
    long: `Please keep this under ${CONTACT_LIMITS.brief.max} characters.`,
  },
} as const;

type Checked = { value: string | null; error: string | null };

function check(
  read: FieldRead,
  min: number,
  copy: { missing: string; long: string },
): Checked {
  if (!read.ok) {
    return { value: null, error: read.reason === "long" ? copy.long : copy.missing };
  }
  if (read.value.length < min) return { value: null, error: copy.missing };
  return { value: read.value, error: null };
}

export function parseContactFields(input: ContactFields): ParsedContact {
  const values: ContactValues = {
    name: asString(input.name).trim(),
    organisation: asString(input.organisation).trim(),
    brief: asString(input.brief).trim(),
    email: asString(input.email).trim(),
  };

  // Raw values ride along so the confirmation a bot sees is built from the
  // same material as a real one, and stays indistinguishable from it.
  if (asString(input.website).trim()) {
    return { ok: true, spam: true, values };
  }

  const name = check(
    readField(input.name, CONTACT_LIMITS.name.max),
    CONTACT_LIMITS.name.min,
    FIELD_COPY.name,
  );
  const organisation = check(
    readField(input.organisation, CONTACT_LIMITS.organisation.max),
    CONTACT_LIMITS.organisation.min,
    FIELD_COPY.organisation,
  );
  const brief = check(
    readField(input.brief, CONTACT_LIMITS.brief.max),
    CONTACT_LIMITS.brief.min,
    FIELD_COPY.brief,
  );
  const email = readEmail(input.email);

  const errors: FieldErrors = {};
  if (name.error) errors.name = name.error;
  if (organisation.error) errors.organisation = organisation.error;
  if (!email) errors.email = FIELD_COPY.email.missing;
  if (brief.error) errors.brief = brief.error;

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      errors,
      values,
    };
  }

  if (!name.value || !organisation.value || !email || !brief.value) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      values,
    };
  }

  return {
    ok: true,
    spam: false,
    data: {
      name: name.value,
      organisation: organisation.value,
      email,
      brief: brief.value,
    },
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
  return value
    .replace(CONTROL_CHARS_GLOBAL, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
