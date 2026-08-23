-- Append-only family event log. Products do not share tables; they publish
-- here and other products read. This is the sync bus and the audit trail.

create table if not exists events (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  system text not null,
  kind text not null,
  org_ref text,
  actor_kind text not null default 'system',
  actor_ref text,
  subject_ref text,
  payload jsonb not null default '{}'::jsonb,
  contracts_version text not null,
  request_id text
);

create index if not exists events_system_id_idx on events (system, id);
create index if not exists events_kind_id_idx on events (kind, id);
create index if not exists events_org_id_idx on events (org_ref, id);
