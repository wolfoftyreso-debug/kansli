-- tasks are per workshop. intakes stay house-level (house_org_ref, no RLS).

do $$
begin
  alter table kansli.tasks enable row level security;
  drop policy if exists tenant_isolation on kansli.tasks;
  create policy tenant_isolation on kansli.tasks
    using (
      current_setting('app.org_ref', true) is null
      or current_setting('app.org_ref', true) = ''
      or org_ref = current_setting('app.org_ref', true)
    )
    with check (
      current_setting('app.org_ref', true) is null
      or current_setting('app.org_ref', true) = ''
      or org_ref = current_setting('app.org_ref', true)
    );
end $$;
