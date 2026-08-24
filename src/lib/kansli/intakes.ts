import { randomUUID } from "node:crypto";
import type pg from "pg";

export const DEMO_MODULES = ["tyra", "irma", "ekonomi", "tora", "britt", "rita", "alva"] as const;
export type DemoModule = (typeof DEMO_MODULES)[number];

export const DEMO_MODULE_LABELS: Record<DemoModule, string> = {
  tyra: "TYRA — däckhotell",
  irma: "IRMA — underlag L0–L1",
  ekonomi: "Ekonomi — faktura 10 dagar",
  tora: "TORA — anbudsrätt (demo-marknad)",
  britt: "BRITT — inkorg",
  rita: "RITA — skattjakt (om motorn finns)",
  alva: "ALVA — intag, inte diagnos",
};

export const MEETING_DELAY_DAYS = 10;

export interface Intake {
  id: string;
  companyName: string;
  orgNumber: string | null;
  contactName: string;
  contactEmail: string;
  contactTitle: string | null;
  sites: string | null;
  brands: string | null;
  dms: string | null;
  economySystem: string | null;
  tireHotel: string | null;
  smsProvider: string | null;
  identitySystem: string | null;
  environment: string | null;
  oidcNotes: string | null;
  demoModules: DemoModule[];
  notes: string | null;
  honestyAccepted: boolean;
  provisionAccount: boolean;
  issueInvoice: boolean;
  invoiceNetOre: number | null;
  meetingAt: string;
  provisionedOrgId: string | null;
  provisionedOrgRef: string | null;
  provisionedUserId: string | null;
  provisionedEmail: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
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
  sites?: string;
  brands?: string;
  dms?: string;
  economySystem?: string;
  tireHotel?: string;
  smsProvider?: string;
  identitySystem?: string;
  environment?: string;
  oidcNotes?: string;
  demoModules: DemoModule[];
  notes?: string;
  honestyAccepted: boolean;
  provisionAccount: boolean;
  issueInvoice: boolean;
  invoiceNetOre?: number;
  houseOrgRef: string;
}

const STOCKHOLM = "Europe/Stockholm";

function stockholmParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCKHOLM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const num = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: num("year"), month: num("month"), day: num("day") };
}

/** 10:00 Europe/Stockholm on the calendar day `days` after `now`. */
function stockholmAt(year: number, month: number, day: number, hour: number, minute: number): Date {
  let guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: STOCKHOLM,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  for (let i = 0; i < 4; i += 1) {
    const seen = fmt.formatToParts(guess);
    const num = (type: string) => Number(seen.find((part) => part.type === type)?.value);
    const delta =
      Date.UTC(year, month - 1, day, hour, minute) -
      Date.UTC(num("year"), num("month") - 1, num("day"), num("hour"), num("minute"));
    if (delta === 0) break;
    guess = new Date(guess.getTime() + delta);
  }
  return guess;
}

export function meetingAtFrom(now: Date, days = MEETING_DELAY_DAYS): Date {
  if (!Number.isInteger(days) || days < 1) {
    throw new Error("mötesförskjutning måste vara ett heltal ≥ 1 dag.");
  }
  const start = stockholmParts(now);
  const wall = new Date(Date.UTC(start.year, start.month - 1, start.day));
  wall.setUTCDate(wall.getUTCDate() + days);
  return stockholmAt(wall.getUTCFullYear(), wall.getUTCMonth() + 1, wall.getUTCDate(), 10, 0);
}

export function parseDemoModules(values: unknown[]): DemoModule[] {
  const allowed = new Set<string>(DEMO_MODULES);
  const out: DemoModule[] = [];
  for (const value of values) {
    const key = String(value ?? "").trim();
    if (allowed.has(key) && !out.includes(key as DemoModule)) out.push(key as DemoModule);
  }
  return out;
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
  const honestyAccepted = form.get("honestyAccepted") === "on";
  if (!honestyAccepted) {
    throw new Error("ärlighetsrutan måste kryssas. Det här är inte ett sålt koncernavtal.");
  }
  const kronor = String(form.get("invoiceKronor") ?? "").trim();
  let invoiceNetOre: number | undefined;
  if (kronor) {
    const n = Number(kronor.replace(",", "."));
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(Math.round(n * 100))) {
      throw new Error("faktura-belopp ska vara kronor, inte öre.");
    }
    invoiceNetOre = Math.round(n * 100);
  }
  return {
    companyName,
    orgNumber: optional(form, "orgNumber"),
    contactName,
    contactEmail,
    contactTitle: optional(form, "contactTitle"),
    sites: optional(form, "sites"),
    brands: optional(form, "brands"),
    dms: optional(form, "dms"),
    economySystem: optional(form, "economySystem"),
    tireHotel: optional(form, "tireHotel"),
    smsProvider: optional(form, "smsProvider"),
    identitySystem: optional(form, "identitySystem"),
    environment: optional(form, "environment"),
    oidcNotes: optional(form, "oidcNotes"),
    demoModules: parseDemoModules(form.getAll("demoModules")),
    notes: optional(form, "notes"),
    honestyAccepted,
    provisionAccount: form.get("provisionAccount") === "on",
    issueInvoice: form.get("issueInvoice") === "on",
    invoiceNetOre,
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

export async function insertIntake(
  pool: pg.Pool,
  draft: IntakeDraft,
  meetingAt: Date,
): Promise<Intake> {
  const id = randomUUID();
  const { rows } = await pool.query(INSERT_SQL, [
    id,
    draft.companyName,
    draft.orgNumber ?? null,
    draft.contactName,
    draft.contactEmail,
    draft.contactTitle ?? null,
    draft.sites ?? null,
    draft.brands ?? null,
    draft.dms ?? null,
    draft.economySystem ?? null,
    draft.tireHotel ?? null,
    draft.smsProvider ?? null,
    draft.identitySystem ?? null,
    draft.environment ?? null,
    draft.oidcNotes ?? null,
    draft.demoModules,
    draft.notes ?? null,
    draft.honestyAccepted,
    draft.provisionAccount,
    draft.issueInvoice,
    draft.invoiceNetOre ?? null,
    meetingAt.toISOString(),
    draft.houseOrgRef,
  ]);
  return toIntake(rows[0]!);
}

export async function listIntakes(pool: pg.Pool): Promise<Intake[]> {
  const { rows } = await pool.query(`${SELECT_SQL} order by created_at desc`);
  return rows.map(toIntake);
}

export async function getIntake(pool: pg.Pool, id: string): Promise<Intake | null> {
  const { rows } = await pool.query(`${SELECT_SQL} where id = $1`, [id]);
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
        password_once = coalesce($8, password_once),
        blocked = coalesce($9, blocked)
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
      patch.passwordOnce ?? null,
      patch.blocked ?? null,
    ],
  );
  return rows[0] ? toIntake(rows[0]) : null;
}

const COLUMNS = `
  id, company_name, org_number, contact_name, contact_email, contact_title,
  sites, brands, dms, economy_system, tire_hotel, sms_provider, identity_system,
  environment, oidc_notes, demo_modules, notes, honesty_accepted,
  provision_account, issue_invoice, invoice_net_ore, meeting_at,
  provisioned_org_id, provisioned_org_ref, provisioned_user_id, provisioned_email,
  invoice_id, invoice_number, house_org_ref, blocked, created_at
`;

const SELECT_SQL = `select ${COLUMNS} from kansli.intakes`;

const INSERT_SQL = `
  insert into kansli.intakes (
    id, company_name, org_number, contact_name, contact_email, contact_title,
    sites, brands, dms, economy_system, tire_hotel, sms_provider, identity_system,
    environment, oidc_notes, demo_modules, notes, honesty_accepted,
    provision_account, issue_invoice, invoice_net_ore, meeting_at, house_org_ref
  ) values (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
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
    sites: row.sites ? String(row.sites) : null,
    brands: row.brands ? String(row.brands) : null,
    dms: row.dms ? String(row.dms) : null,
    economySystem: row.economy_system ? String(row.economy_system) : null,
    tireHotel: row.tire_hotel ? String(row.tire_hotel) : null,
    smsProvider: row.sms_provider ? String(row.sms_provider) : null,
    identitySystem: row.identity_system ? String(row.identity_system) : null,
    environment: row.environment ? String(row.environment) : null,
    oidcNotes: row.oidc_notes ? String(row.oidc_notes) : null,
    demoModules: parseDemoModules((row.demo_modules as unknown[]) ?? []),
    notes: row.notes ? String(row.notes) : null,
    honestyAccepted: Boolean(row.honesty_accepted),
    provisionAccount: Boolean(row.provision_account),
    issueInvoice: Boolean(row.issue_invoice),
    invoiceNetOre: row.invoice_net_ore == null ? null : Number(row.invoice_net_ore),
    meetingAt: new Date(String(row.meeting_at)).toISOString(),
    provisionedOrgId: row.provisioned_org_id ? String(row.provisioned_org_id) : null,
    provisionedOrgRef: row.provisioned_org_ref ? String(row.provisioned_org_ref) : null,
    provisionedUserId: row.provisioned_user_id ? String(row.provisioned_user_id) : null,
    provisionedEmail: row.provisioned_email ? String(row.provisioned_email) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    houseOrgRef: row.house_org_ref ? String(row.house_org_ref) : null,
    blocked: Array.isArray(row.blocked) ? row.blocked.map(String) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}
