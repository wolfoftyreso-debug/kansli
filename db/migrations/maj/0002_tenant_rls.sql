do $$
declare
  t text;
begin
  foreach t in array array['projects','signals','actions','releases','usage_ledger','strategy_proposals']
  loop
    execute format('alter table maj.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on maj.%I', t);
    execute format(
      $p$
      create policy tenant_isolation on maj.%I
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
