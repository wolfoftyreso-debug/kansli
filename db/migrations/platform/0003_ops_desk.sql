-- Sambandscentral: SMS-rutter och larmkö. Insert-only så eventloggen
-- fortsätter vara append. Senaste raden per org+kind gäller.

create table if not exists sms_routes (
  id text primary key,
  org_ref text not null,
  kind text not null check (kind in ('overdue', 'support', 'sms_failed', 'readiness')),
  phone text not null,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists sms_routes_org_kind_idx
  on sms_routes (org_ref, kind, created_at desc);

create table if not exists alarm_states (
  id text primary key,
  org_ref text not null,
  kind text not null check (kind in ('overdue', 'support', 'sms_failed', 'readiness')),
  active boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists alarm_states_org_kind_idx
  on alarm_states (org_ref, kind, created_at desc);

create table if not exists alarm_outbox (
  id text primary key,
  org_ref text not null,
  kind text not null check (kind in ('overdue', 'support', 'sms_failed', 'readiness')),
  recipient text not null,
  body text not null,
  status text not null check (status in ('PENDING', 'SENT', 'FAILED', 'BLOCKED')),
  last_error text,
  provider_ref text,
  created_at timestamptz not null default now()
);

create index if not exists alarm_outbox_org_idx
  on alarm_outbox (org_ref, created_at desc);

do $$
declare
  t text;
begin
  foreach t in array array['sms_routes', 'alarm_states', 'alarm_outbox']
  loop
    execute format('alter table platform.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on platform.%I', t);
    execute format(
      $p$
      create policy tenant_isolation on platform.%I
        using (
          current_setting('app.org_ref', true) is null
          or current_setting('app.org_ref', true) = ''
          or org_ref = current_setting('app.org_ref', true)
        )
        with check (
          current_setting('app.org_ref', true) is null
          or current_setting('app.org_ref', true) = ''
          or org_ref = current_setting('app.org_ref', true)
        )
      $p$,
      t
    );
  end loop;
end $$;
