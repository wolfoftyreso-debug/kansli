create table if not exists metric_snapshots (
  id text primary key,
  org_ref text not null,
  period text not null,
  revenue numeric not null,
  plan_revenue numeric not null,
  cash numeric not null,
  monthly_burn numeric not null,
  top_customer_share numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists metric_snapshots_org_idx
  on metric_snapshots (org_ref, created_at desc);

create table if not exists analysis_runs (
  id text primary key,
  org_ref text not null,
  status text not null,
  finding_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists analysis_runs_org_idx
  on analysis_runs (org_ref, created_at desc);

create table if not exists findings (
  id text primary key,
  org_ref text not null,
  run_id text not null references analysis_runs (id),
  fingerprint text not null,
  severity text not null,
  category text not null,
  title text not null,
  body text not null,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists findings_org_idx
  on findings (org_ref, created_at desc);
