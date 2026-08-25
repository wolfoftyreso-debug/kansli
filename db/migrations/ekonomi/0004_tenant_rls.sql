-- Pin customer rows to app.org_ref when the request sets it.
-- Empty setting keeps cron, tests and guest paths working. Table owner bypasses RLS.

do $$
declare
  t text;
begin
  foreach t in array array[
    'journals',
    'transactions',
    'entries',
    'invoices',
    'invoice_lines',
    'payments',
    'inbound_transfers',
    'connectors',
    'documents',
    'integration_connections',
    'integration_oauth_states',
    'sales_alert_settings',
    'sales_alert_outbox'
  ]
  loop
    execute format('alter table ekonomi.%I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on ekonomi.%I', t);
    execute format(
      $p$
      create policy tenant_isolation on ekonomi.%I
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
