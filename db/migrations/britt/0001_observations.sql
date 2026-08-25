create table if not exists observations (
  id text primary key,
  org_ref text not null,
  source_system text not null,
  title text not null,
  body text not null default '',
  severity text not null default 'info',
  subject_ref text,
  created_at timestamptz not null default now()
);

create index if not exists observations_org_idx on observations (org_ref, created_at desc);
