create table if not exists inquiries (
  id text primary key,
  org_ref text not null,
  subject_org_number text not null,
  subject_name text,
  reason text,
  status text not null default 'open',
  assessment text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inquiries_org_idx on inquiries (org_ref, created_at desc);
