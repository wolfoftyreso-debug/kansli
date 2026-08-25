-- Workshop-filled protocol shell. Not a diagnosis, not findings, not a session.
alter table cases add column if not exists technician_notes text;
alter table cases add column if not exists updated_at timestamptz not null default now();

create table if not exists case_observations (
  id text primary key,
  org_ref text not null,
  case_id text not null references cases (id) on delete cascade,
  label text not null,
  value text not null,
  recorded_by_ref text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists case_observations_case_idx
  on case_observations (org_ref, case_id, recorded_at desc);

create table if not exists case_measurements (
  id text primary key,
  org_ref text not null,
  case_id text not null references cases (id) on delete cascade,
  name text not null,
  value numeric not null,
  unit text not null,
  recorded_by_ref text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists case_measurements_case_idx
  on case_measurements (org_ref, case_id, recorded_at desc);
