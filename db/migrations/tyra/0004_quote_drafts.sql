-- Workshop-entered quote drafts. Not live supplier prices.
create table if not exists quote_drafts (
  id text primary key,
  org_ref text not null,
  tire_case_id text not null references tire_cases (id) on delete cascade,
  title text not null,
  quantity int not null,
  unit_cost_ore int not null,
  installation_ore int not null default 0,
  environmental_ore int not null default 0,
  markup_percent numeric not null default 0,
  total_ore int not null,
  snapshot jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists quote_drafts_case_idx
  on quote_drafts (org_ref, tire_case_id, created_at desc);
