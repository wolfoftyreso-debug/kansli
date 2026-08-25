do $$
declare
  t text;
begin
  foreach t in array array['market_snapshots', 'company_profiles']
  loop
    execute format('alter table tora.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on tora.%I', t);
    execute format(
      $p$
      create policy tenant_isolation on tora.%I
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
