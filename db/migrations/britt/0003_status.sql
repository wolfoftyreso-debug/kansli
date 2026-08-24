alter table observations
  add column if not exists status text not null default 'open';

create index if not exists observations_org_status_idx
  on observations (org_ref, status, created_at desc);
