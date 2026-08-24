import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { hashPassword } from "@pixdrift/auth-core";
import { formatRef, platformRef } from "@pixdrift/contracts";
import { createPool } from "@pixdrift/db";

export function orgRefFor(orgId: string): string {
  return formatRef(platformRef("org", orgId));
}

export function slugifyCompany(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return slug || "verkstad";
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generateWorkshopPassword(): string {
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < 16; i += 1) {
    out += PASSWORD_ALPHABET[bytes[i]! % PASSWORD_ALPHABET.length];
    if (i === 3 || i === 7 || i === 11) out += "-";
  }
  return out;
}

export type ProvisionStatus = "created" | "email_exists" | "blocked";

export interface ProvisionResult {
  status: ProvisionStatus;
  orgId: string;
  orgRef: string;
  userId: string;
  email: string;
  passwordOnce: string | null;
  detail: string;
}

export async function provisionWorkshopAccount(input: {
  ownerUrl: string;
  companyName: string;
  orgNumber?: string | null;
  contactName: string;
  email: string;
}): Promise<ProvisionResult> {
  const pool = createPool(input.ownerUrl, { applicationName: "kansli-provision", max: 2 });
  try {
    return await provisionWithPool(pool, input);
  } finally {
    await pool.end();
  }
}

export async function provisionWithPool(
  pool: pg.Pool,
  input: {
    companyName: string;
    orgNumber?: string | null;
    contactName: string;
    email: string;
  },
): Promise<ProvisionResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await pool.query<{ id: string }>(
    `select id from users where lower(email) = lower($1)`,
    [email],
  );
  const slug = slugifyCompany(input.companyName);
  let orgId = `org-${slug}`;
  const taken = await pool.query(`select 1 from organizations where id = $1`, [orgId]);
  if ((taken.rowCount ?? 0) > 0) {
    orgId = `org-${slug}-${randomBytes(3).toString("hex")}`;
  }

  await pool.query(
    `insert into organizations (id, name, country, is_demo, tier)
     values ($1, $2, 'SE', false, 'pilot')`,
    [orgId, input.companyName.trim()],
  );
  if (input.orgNumber?.trim()) {
    await pool.query(
      `insert into legal_entities (id, org_id, name, registration_number, country)
       values ($1, $2, $3, $4, 'SE')`,
      [`le-${orgId}`, orgId, input.companyName.trim(), input.orgNumber.trim()],
    );
  }

  if (existing.rows[0]) {
    const userId = existing.rows[0].id;
    await pool.query(
      `insert into memberships (id, user_id, org_id, role_keys)
       values ($1, $2, $3, '["orgOwner"]'::jsonb)
       on conflict (user_id, org_id) do nothing`,
      [`m-${randomUUID()}`, userId, orgId],
    );
    return {
      status: "email_exists",
      orgId,
      orgRef: orgRefFor(orgId),
      userId,
      email,
      passwordOnce: null,
      detail: "E-posten fanns redan. Nytt bolag kopplades. Logga in med det lösen ni redan har.",
    };
  }

  const passwordOnce = generateWorkshopPassword();
  const userId = `user-${slug}-${randomBytes(2).toString("hex")}`;
  const passwordHash = await hashPassword(passwordOnce);
  await pool.query(
    `insert into users (id, email, display_name, status, password_hash)
     values ($1, $2, $3, 'active', $4)`,
    [userId, email, input.contactName.trim(), passwordHash],
  );
  await pool.query(
    `insert into memberships (id, user_id, org_id, role_keys)
     values ($1, $2, $3, '["orgOwner"]'::jsonb)`,
    [`m-${userId}-${orgId}`.slice(0, 64), userId, orgId],
  );
  return {
    status: "created",
    orgId,
    orgRef: orgRefFor(orgId),
    userId,
    email,
    passwordOnce,
    detail: "Konto skapat. Lösenordet visas en gång.",
  };
}
