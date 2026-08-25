-- Slice 1: CRM + ärendemotor + kundhub. Inga identitetstabeller — org_ref
-- kommer från PIXDRIFT Identity. search_path sätts till tyra av migreraren.

create table if not exists customers (
  id text primary key,
  org_ref text not null,
  kind text not null default 'private',
  name text not null,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create index if not exists customers_org_idx on customers (org_ref, created_at desc);

create table if not exists vehicles (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  registration_number text not null,
  vin text,
  make text,
  model text,
  model_year int,
  created_at timestamptz not null default now(),
  unique (org_ref, registration_number)
);

create table if not exists wheel_sets (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  vehicle_id text references vehicles (id) on delete set null,
  season text not null,
  wheel_count int not null default 4,
  status text not null default 'REGISTERED',
  storage_status text not null default 'UNKNOWN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wheel_sets_org_vehicle_idx on wheel_sets (org_ref, vehicle_id);

create table if not exists tire_cases (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  vehicle_id text references vehicles (id) on delete set null,
  intent text not null default 'MIXED',
  case_status text not null default 'OPEN',
  work_status text not null default 'READY',
  wheel_status text not null default 'UNKNOWN',
  commercial_status text not null default 'NOT_REQUIRED',
  documentation_status text not null default 'NOT_REQUIRED',
  source_state jsonb not null default '{}'::jsonb,
  target_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tire_cases_org_status_idx
  on tire_cases (org_ref, case_status, updated_at desc);

create table if not exists tire_case_operations (
  id text primary key,
  org_ref text not null,
  tire_case_id text not null references tire_cases (id) on delete cascade,
  canonical_operation text not null,
  created_at timestamptz not null default now()
);

create table if not exists tire_case_steps (
  id text primary key,
  org_ref text not null,
  tire_case_id text not null references tire_cases (id) on delete cascade,
  step_kind text not null,
  title text not null,
  status text not null default 'TODO',
  required boolean not null default true,
  requires jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tire_case_steps_case_idx
  on tire_case_steps (org_ref, tire_case_id, sort_order);

create table if not exists tire_case_events (
  id text primary key,
  org_ref text not null,
  tire_case_id text not null references tire_cases (id) on delete cascade,
  event_type text not null,
  data jsonb,
  actor_ref text,
  source text not null default 'SYSTEM',
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create index if not exists tire_case_events_case_idx
  on tire_case_events (org_ref, tire_case_id, created_at desc);

create table if not exists customer_hub_links (
  id text primary key,
  org_ref text not null,
  customer_id text not null references customers (id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  unique (token_hash),
  unique (org_ref, customer_id)
);

create table if not exists tire_inspections (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  vehicle_id text references vehicles (id) on delete set null,
  wheel_set_id text references wheel_sets (id) on delete set null,
  tire_case_id text references tire_cases (id) on delete set null,
  captured_at timestamptz not null default now(),
  captured_by_ref text,
  source text not null default 'PHYSICAL_INSPECTION',
  inspection_status text not null default 'PRELIMINARY',
  created_at timestamptz not null default now()
);

create table if not exists tire_inspection_positions (
  id text primary key,
  org_ref text not null,
  inspection_id text not null references tire_inspections (id) on delete cascade,
  position text not null,
  tread_depth_mm numeric(3, 1),
  tread_depth_source text,
  confidence numeric,
  verified boolean not null default false,
  verified_by_ref text,
  verified_at timestamptz,
  wear_pattern text,
  damage_types text[],
  tyre_brand text,
  tyre_model text,
  tyre_dimension text,
  dot_week int,
  dot_year int,
  valve_age_years int,
  valve_condition text,
  rim_severity text,
  tyre_pressure_kpa int,
  inflation_state text,
  fill_gas text,
  notes text,
  created_at timestamptz not null default now(),
  unique (inspection_id, position)
);
