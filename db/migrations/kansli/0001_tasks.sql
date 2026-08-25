create table if not exists tasks (
  id text primary key,
  org_ref text not null,
  title text not null,
  owner text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  created_by text
);

create index if not exists tasks_org_created_idx on tasks (org_ref, created_at desc);
