create table if not exists cases (
  id text primary key,
  org_ref text not null,
  complaint text not null,
  vehicle_ref text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create index if not exists cases_org_idx on cases (org_ref, created_at desc);
