import { randomUUID } from "node:crypto";
import type pg from "pg";
import { normalizeOrgNumber, orgNumberError } from "../platform/org-number.ts";
import { parseModules, type SellableModule } from "./pricing.ts";

export interface Intake {
  id: string;
  companyName: string;
  orgNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactTitle: string | null;
  /** Purchased modules. Kansli and the platform chrome are always included. */
  modules: SellableModule[];
  notes: string | null;
  termsAccepted: boolean;
  /** Monthly subscription, net öre, as priced at registration. */
  monthlyNetOre: number | null;
  provisionedOrgId: string | null;
  provisionedOrgRef: string | null;
  provisionedUserId: string | null;
  provisionedEmail: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  /** All year instalments, issued at once at registration. */
  invoiceNumbers: string[];
  houseOrgRef: string | null;
  blocked: string[];
  createdAt: string;
}

export interface IntakeDraft {
  companyName: string;
  orgNumber?: string;
  contactName: string;
  contactEmail: string;
  contactTitle?: string;
  modules: SellableModule[];
  notes?: string;
  termsAccepted: boolean;
  houseOrgRef: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseIntakeForm(form: FormData, houseOrgRef: string): IntakeDraft {
  const companyName = String(form.get("companyName") ?? "").trim();
  const contactName = String(form.get("contactName") ?? "").trim();
  const contactEmail = String(form.get("contactEmail") ?? "")
    .trim()
    .toLowerCase();
  if (companyName.length < 2) throw new Error("bolagsnamn krävs.");
  if (contactName.length < 2) throw new Error("kontaktperson krävs.");
  if (!EMAIL.test(contactEmail)) throw new Error("en giltig arbets-e-post krävs.");
  const modules = parseModules(form.getAll("modules"));
  if (modules.length === 0) throw new Error("välj minst en modul.");
  const termsAccepted = form.get("termsAccepted") === "on";
  if (!termsAccepted) {
    throw new Error("villkorsrutan måste kryssas. Registreringen skapar en faktura.");
  }
  const rawOrgNumber = optional(form, "orgNumber");
  if (rawOrgNumber && orgNumberError(rawOrgNumber)) {
    throw new Error(orgNumberError(rawOrgNumber)!);
  }
  const orgNumber = rawOrgNumber ? (normalizeOrgNumber(rawOrgNumber) ?? rawOrgNumber) : undefined;
  return {
    companyName,
    orgNumber,
    contactName,
    contactEmail,
    contactTitle: optional(form, "contactTitle"),
    modules,
    notes: optional(form, "notes"),
    termsAccepted,
    houseOrgRef,
  };
}

function optional(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? "").trim();
  return value || undefined;
}

export function houseOrgRefFromEnv(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): string {
  return env.PIXDRIFT_HOUSE_ORG_REF?.trim() || "pixdrift:org:org-exempelbolaget";
}

/** House CRM is not a workshop board. Only the active house org may read it. */
export function isHouseSession(
  orgRef: string | null | undefined,
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>,
): boolean {
  return Boolean(orgRef && orgRef === houseOrgRefFromEnv(env));
}

export async function insertIntake(
  pool: pg.Pool,
  draft: IntakeDraft,
  monthlyNetOre: number,
): Promise<Intake> {
  const id = randomUUID();
  const { rows } = await pool.query(INSERT_SQL, [
    id,
    draft.companyName,
    draft.orgNumber ?? null,
    draft.contactName,
    draft.contactEmail,
    draft.contactTitle ?? null,
    draft.modules,
    draft.notes ?? null,
    draft.termsAccepted,
    monthlyNetOre,
    draft.houseOrgRef,
  ]);
  return toIntake(rows[0]!);
}

export async function listIntakes(pool: pg.Pool, houseOrgRef: string): Promise<Intake[]> {
  const { rows } = await pool.query(
    `${SELECT_SQL} where house_org_ref = $1 order by created_at desc`,
    [houseOrgRef],
  );
  return rows.map(toIntake);
}

export async function getIntake(pool: pg.Pool, id: string): Promise<Intake | null> {
  const { rows } = await pool.query(`${SELECT_SQL} where id = $1`, [id]);
  return rows[0] ? toIntake(rows[0]) : null;
}

export async function getHouseIntake(
  pool: pg.Pool,
  houseOrgRef: string,
  id: string,
): Promise<Intake | null> {
  const { rows } = await pool.query(`${SELECT_SQL} where id = $1 and house_org_ref = $2`, [
    id,
    houseOrgRef,
  ]);
  return rows[0] ? toIntake(rows[0]) : null;
}

export async function takePasswordOnce(pool: pg.Pool, id: string): Promise<string | null> {
  const { rows } = await pool.query<{ password_once: string | null }>(
    `with old as (
       select password_once from kansli.intakes where id = $1
     )
     update kansli.intakes set password_once = null
      where id = $1
      returning (select password_once from old)`,
    [id],
  );
  return rows[0]?.password_once ?? null;
}

export async function peekPasswordOnce(pool: pg.Pool, id: string): Promise<string | null> {
  const { rows } = await pool.query<{ password_once: string | null }>(
    `select password_once from kansli.intakes where id = $1`,
    [id],
  );
  return rows[0]?.password_once ?? null;
}

export async function updateIntakeOutcome(
  pool: pg.Pool,
  id: string,
  patch: {
    provisionedOrgId?: string | null;
    provisionedOrgRef?: string | null;
    provisionedUserId?: string | null;
    provisionedEmail?: string | null;
    invoiceId?: string | null;
    invoiceNumber?: string | null;
    invoiceNumbers?: string[] | null;
    passwordOnce?: string | null;
    blocked?: string[];
  },
): Promise<Intake | null> {
  const { rows } = await pool.query(
    `update kansli.intakes set
        provisioned_org_id = coalesce($2, provisioned_org_id),
        provisioned_org_ref = coalesce($3, provisioned_org_ref),
        provisioned_user_id = coalesce($4, provisioned_user_id),
        provisioned_email = coalesce($5, provisioned_email),
        invoice_id = coalesce($6, invoice_id),
        invoice_number = coalesce($7, invoice_number),
        invoice_numbers = coalesce($8, invoice_numbers),
        password_once = coalesce($9, password_once),
        blocked = coalesce($10, blocked)
      where id = $1
      returning ${COLUMNS}`,
    [
      id,
      patch.provisionedOrgId ?? null,
      patch.provisionedOrgRef ?? null,
      patch.provisionedUserId ?? null,
      patch.provisionedEmail ?? null,
      patch.invoiceId ?? null,
      patch.invoiceNumber ?? null,
      patch.invoiceNumbers ?? null,
      patch.passwordOnce ?? null,
      patch.blocked ?? null,
    ],
  );
  return rows[0] ? toIntake(rows[0]) : null;
}

const COLUMNS = `
  id, company_name, org_number, contact_name, contact_email, contact_title,
  modules, notes, honesty_accepted, invoice_net_ore,
  provisioned_org_id, provisioned_org_ref, provisioned_user_id, provisioned_email,
  invoice_id, invoice_number, invoice_numbers, house_org_ref, blocked, created_at
`;

const SELECT_SQL = `select ${COLUMNS} from kansli.intakes`;

const INSERT_SQL = `
  insert into kansli.intakes (
    id, company_name, org_number, contact_name, contact_email, contact_title,
    modules, notes, honesty_accepted, provision_account, issue_invoice,
    invoice_net_ore, house_org_ref
  ) values (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,true,true,$10,$11
  ) returning ${COLUMNS}
`;

function toIntake(row: Record<string, unknown>): Intake {
  return {
    id: String(row.id),
    companyName: String(row.company_name),
    orgNumber: row.org_number ? String(row.org_number) : null,
    contactName: String(row.contact_name),
    contactEmail: String(row.contact_email),
    contactTitle: row.contact_title ? String(row.contact_title) : null,
    modules: parseModules((row.modules as unknown[]) ?? []),
    notes: row.notes ? String(row.notes) : null,
    termsAccepted: Boolean(row.honesty_accepted),
    monthlyNetOre: row.invoice_net_ore == null ? null : Number(row.invoice_net_ore),
    provisionedOrgId: row.provisioned_org_id ? String(row.provisioned_org_id) : null,
    provisionedOrgRef: row.provisioned_org_ref ? String(row.provisioned_org_ref) : null,
    provisionedUserId: row.provisioned_user_id ? String(row.provisioned_user_id) : null,
    provisionedEmail: row.provisioned_email ? String(row.provisioned_email) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    invoiceNumbers: Array.isArray(row.invoice_numbers)
      ? (row.invoice_numbers as unknown[]).map(String)
      : [],
    houseOrgRef: row.house_org_ref ? String(row.house_org_ref) : null,
    blocked: Array.isArray(row.blocked) ? row.blocked.map(String) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}
