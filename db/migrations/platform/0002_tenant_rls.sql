-- Event log is per org when the request sets app.org_ref.
-- Rows with null org_ref stay visible only when the setting is empty (owner/cron).

do $$
begin
  alter table platform.events enable row level security;
  drop policy if exists tenant_isolation on platform.events;
  create policy tenant_isolation on platform.events
    using (
      current_setting('app.org_ref', true) is null
      or current_setting('app.org_ref', true) = ''
      or org_ref = current_setting('app.org_ref', true)
    )
    with check (
      current_setting('app.org_ref', true) is null
      or current_setting('app.org_ref', true) = ''
      or org_ref is null
      or org_ref = current_setting('app.org_ref', true)
    );
end $$;
