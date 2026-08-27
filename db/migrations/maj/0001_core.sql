-- MAJ — Mät, analysera, justera. Search intelligence & execution.
-- Vendor data verbatim in signals; decisions carry a full provenance trail.

create table if not exists projects (
  id text primary key,
  org_ref text not null,
  domain text not null,
  market text not null default 'SE',
  language text not null default 'sv',
  -- customers | rank | competitors | authority | all
  goal text not null,
  -- conservative | balanced | aggressive | hedge
  posture text not null default 'balanced',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists maj_projects_org_idx on projects (org_ref, created_at desc);

-- Raw observations with provenance. The system never invents numbers.
create table if not exists signals (
  id text primary key,
  org_ref text not null,
  project_id text not null,
  -- capability adapter id: webintel | search-console | analytics | crawler
  source text not null,
  kind text not null,
  payload jsonb not null,
  observed_at timestamptz not null default now()
);
create index if not exists maj_signals_project_idx on signals (org_ref, project_id, observed_at desc);

-- The action queue: few decisions, evidence behind each.
create table if not exists actions (
  id text primary key,
  org_ref text not null,
  project_id text not null,
  -- connect_source | competitive | content | technical | links
  kind text not null,
  title text not null,
  why text not null,
  -- low | medium | high
  risk text not null,
  expected_impact text not null,
  -- 0–100
  confidence int not null,
  -- proposed | approved | declined | done
  state text not null default 'proposed',
  evidence jsonb not null default '[]',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text
);
create index if not exists maj_actions_project_idx on actions (org_ref, project_id, state, created_at desc);

-- Every completed change is a versioned release: human card + machine object.
create table if not exists releases (
  id text primary key,
  org_ref text not null,
  project_id text not null,
  version text not null,
  title text not null,
  summary text not null,
  -- release.v1: trigger, signals, decisions, changes, rollback, measurement_plan
  machine jsonb not null,
  published_at timestamptz not null default now()
);
create index if not exists maj_releases_project_idx on releases (org_ref, project_id, published_at desc);

-- Usage is money. Booked before the call is made, never after.
create table if not exists usage_ledger (
  id text primary key,
  org_ref text not null,
  project_id text,
  -- vendor_units | llm_tokens | crawl_ms | jobs
  meter text not null,
  amount bigint not null,
  note text,
  booked_at timestamptz not null default now()
);
create index if not exists maj_usage_org_idx on usage_ledger (org_ref, booked_at desc);

-- Strategy Arena: proposals with predictions, judged, then measured.
create table if not exists strategy_proposals (
  id text primary key,
  org_ref text not null,
  project_id text not null,
  action_id text,
  -- strategist id, e.g. rule.v1 (LLM strategists plug in later)
  strategist text not null,
  proposal jsonb not null,
  predicted_impact int,
  chosen boolean not null default false,
  actual_impact int,
  created_at timestamptz not null default now()
);
create index if not exists maj_arena_project_idx on strategy_proposals (org_ref, project_id, created_at desc);
