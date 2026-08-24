-- Org-specific company facts for the eligibility engine. Market notices stay demo.
create table if not exists company_profiles (
  org_ref text primary key,
  name text not null,
  employees int,
  annual_revenue_sek bigint,
  serves_areas text[] not null default '{}',
  capabilities text[] not null default '{}',
  certifications text[] not null default '{}',
  registrations text[] not null default '{}',
  updated_at timestamptz not null default now()
);
