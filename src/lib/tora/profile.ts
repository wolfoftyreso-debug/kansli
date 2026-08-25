import type pg from "pg";
import { demoCompany, type Company } from "@pixdrift/tora";

export type CompanyProfile = {
  orgRef: string;
  name: string;
  employees: number | null;
  annualRevenueSek: number | null;
  servesAreas: string[];
  capabilities: string[];
  certifications: string[];
  registrations: string[];
};

export function companyFromProfile(profile: CompanyProfile): Company {
  return {
    id: `comp:${profile.orgRef}`,
    name: profile.name,
    employees: profile.employees ?? undefined,
    annualRevenueSek: profile.annualRevenueSek ?? undefined,
    servesAreas: profile.servesAreas,
    capabilities: profile.capabilities,
    certifications: profile.certifications,
    registrations: profile.registrations,
    references: [],
    canRelyOnExternalCapacity: undefined,
  };
}

export async function getCompanyProfile(
  pool: pg.Pool,
  orgRef: string,
): Promise<CompanyProfile | null> {
  const { rows } = await pool.query<{
    org_ref: string;
    name: string;
    employees: number | null;
    annual_revenue_sek: string | number | null;
    serves_areas: string[] | null;
    capabilities: string[] | null;
    certifications: string[] | null;
    registrations: string[] | null;
  }>(
    `select org_ref, name, employees, annual_revenue_sek, serves_areas, capabilities,
            certifications, registrations
       from tora.company_profiles where org_ref = $1 limit 1`,
    [orgRef],
  );
  const row = rows[0];
  if (!row) return null;
  return {
    orgRef: row.org_ref,
    name: row.name,
    employees: row.employees,
    annualRevenueSek: row.annual_revenue_sek == null ? null : Number(row.annual_revenue_sek),
    servesAreas: row.serves_areas ?? [],
    capabilities: row.capabilities ?? [],
    certifications: row.certifications ?? [],
    registrations: row.registrations ?? [],
  };
}

export async function upsertCompanyProfile(input: {
  pool: pg.Pool;
  orgRef: string;
  name: string;
  employees?: number | null;
  annualRevenueSek?: number | null;
  servesAreas: string[];
  capabilities: string[];
  certifications: string[];
  registrations: string[];
}): Promise<CompanyProfile> {
  const name = input.name.trim();
  if (!name) throw new Error("Bolagsnamn krävs.");
  await input.pool.query(
    `insert into tora.company_profiles
       (org_ref, name, employees, annual_revenue_sek, serves_areas, capabilities,
        certifications, registrations)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (org_ref) do update
       set name = excluded.name,
           employees = excluded.employees,
           annual_revenue_sek = excluded.annual_revenue_sek,
           serves_areas = excluded.serves_areas,
           capabilities = excluded.capabilities,
           certifications = excluded.certifications,
           registrations = excluded.registrations,
           updated_at = now()`,
    [
      input.orgRef,
      name,
      input.employees ?? null,
      input.annualRevenueSek ?? null,
      input.servesAreas,
      input.capabilities,
      input.certifications,
      input.registrations,
    ],
  );
  const saved = await getCompanyProfile(input.pool, input.orgRef);
  if (!saved) throw new Error("Profilen kunde inte sparas.");
  return saved;
}

export async function resolveCompany(
  pool: pg.Pool | null,
  orgRef: string | null,
): Promise<Company> {
  if (!pool || !orgRef) return demoCompany;
  const profile = await getCompanyProfile(pool, orgRef);
  return profile ? companyFromProfile(profile) : demoCompany;
}

export function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
