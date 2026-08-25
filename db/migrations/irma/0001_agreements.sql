create table if not exists agreements (
  id text primary key,
  org_ref text not null,
  title text not null,
  counterparty text not null,
  status text not null default 'draft',
  token_hash text,
  created_at timestamptz not null default now()
);

create index if not exists agreements_org_idx on agreements (org_ref, created_at desc);
