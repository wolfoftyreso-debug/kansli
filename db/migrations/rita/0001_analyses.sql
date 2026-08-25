create table if not exists analyses (
  id text primary key,
  org_ref text not null,
  company_name text not null,
  org_number text not null,
  status text not null,
  blocked_reason text,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analyses_org_idx on analyses (org_ref, created_at desc);
