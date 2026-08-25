do $$
begin
  alter table rita.analyses enable row level security;
  drop policy if exists tenant_isolation on rita.analyses;
  create policy tenant_isolation on rita.analyses
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
