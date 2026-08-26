-- Customer hub links are included. Guest pages leave app.org_ref empty
-- and look up by token_hash. Staff pages pin the setting.

do $$
declare
  t text;
begin
  foreach t in array array[
    'customers',
    'vehicles',
    'wheel_sets',
    'tire_cases',
    'tire_case_operations',
    'tire_case_steps',
    'tire_case_events',
    'customer_hub_links',
    'tire_inspections',
    'tire_inspection_positions',
    'org_settings',
    'reminder_runs',
    'reminder_outbox',
    'reminder_deliveries',
    'reminder_threads',
    'tenant_supplier_accounts',
    'supplier_integration_events',
    'tire_products',
    'tire_price_snapshots',
    'quote_drafts'
  ]
  loop
    execute format('alter table tyra.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on tyra.%I', t);
    execute format(
      $p$
      create policy tenant_isolation on tyra.%I
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
