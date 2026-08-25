-- PIXDRIFT_SYNC.md slice 2: reminders/outbox, supplier accounts, commercial
-- placeholders, org settings. Ingen identitetstabell. org_ref från Identity.

alter table customers
  add column if not exists address_line1 text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists country text,
  add column if not exists lifecycle_status text not null default 'ACTIVE';

alter table vehicles
  add column if not exists lifecycle_status text not null default 'ACTIVE',
  add column if not exists sold_at timestamptz,
  add column if not exists remind_season boolean not null default true;

alter table wheel_sets
  add column if not exists disposition_status text not null default 'ACTIVE',
  add column if not exists disposition_notes text;

create table if not exists org_settings (
  org_ref text primary key,
  forgotten_dispose_after_days int,
  sender_name text,
  updated_at timestamptz not null default now()
);

create table if not exists reminder_runs (
  id text primary key,
  org_ref text not null,
  kind text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb
);

create table if not exists reminder_outbox (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  vehicle_id text references vehicles (id) on delete set null,
  channel text not null,
  recipient text not null,
  subject text,
  body text not null,
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text
);

create index if not exists reminder_outbox_org_status_idx
  on reminder_outbox (org_ref, status, created_at desc);

create table if not exists reminder_deliveries (
  id text primary key,
  org_ref text not null,
  customer_id text references customers (id) on delete set null,
  vehicle_id text references vehicles (id) on delete set null,
  reminder_key text not null,
  outbox_id text references reminder_outbox (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (org_ref, vehicle_id, reminder_key)
);

create table if not exists reminder_threads (
  id text primary key,
  org_ref text not null,
  vehicle_id text references vehicles (id) on delete cascade,
  wheel_set_id text references wheel_sets (id) on delete cascade,
  thread_key text not null,
  status text not null default 'OPEN',
  attempt_count int not null default 0,
  last_attempt_at timestamptz,
  escalated_at timestamptz,
  stopped_reason text,
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_ref, thread_key)
);

create table if not exists tenant_supplier_accounts (
  id text primary key,
  org_ref text not null,
  supplier_id text not null,
  external_customer_id text,
  credentials_reference text,
  currency text not null default 'SEK',
  enabled boolean not null default true,
  priority int not null default 100,
  pricing_enabled boolean not null default true,
  ordering_enabled boolean not null default false,
  last_ok_at timestamptz,
  last_error_at timestamptz,
  last_error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_ref, supplier_id)
);

create table if not exists supplier_integration_events (
  id text primary key,
  org_ref text not null,
  supplier_id text not null,
  supplier_account_id text references tenant_supplier_accounts (id) on delete set null,
  level text not null,
  event_type text not null,
  message text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists supplier_integration_events_org_idx
  on supplier_integration_events (org_ref, supplier_id, created_at desc);

create table if not exists tire_products (
  id text primary key,
  org_ref text not null,
  supplier text,
  supplier_product_id text,
  brand text not null,
  model text not null,
  width int not null,
  profile int not null,
  rim_diameter int not null,
  load_index int,
  speed_rating text,
  season text not null,
  run_flat boolean,
  ev_optimized boolean,
  oem_marking text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists tire_price_snapshots (
  id text primary key,
  org_ref text not null,
  tire_product_id text not null references tire_products (id) on delete cascade,
  supplier text,
  supplier_id text,
  supplier_account_id text references tenant_supplier_accounts (id) on delete set null,
  supplier_price_ore int not null,
  supplier_price_timestamp timestamptz not null,
  stock_status text,
  estimated_delivery text,
  retrieved_at timestamptz not null default now(),
  expires_at timestamptz,
  generated_at timestamptz not null default now()
);
