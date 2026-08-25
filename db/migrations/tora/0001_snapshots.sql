create table if not exists market_snapshots (
  id text primary key,
  org_ref text not null,
  company_name text not null,
  tier text not null,
  open_now integer not null,
  upcoming integer not null,
  organization_count integer not null,
  known_value_sek bigint not null,
  headline text not null,
  evaluated_at timestamptz not null default now()
);

create index if not exists market_snapshots_org_idx on market_snapshots (org_ref, evaluated_at desc);
