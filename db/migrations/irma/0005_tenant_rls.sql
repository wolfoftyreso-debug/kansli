-- Staff reads are pinned to app.org_ref. Guest token lookups leave the
-- setting empty and keep working; the token is the secret.

do $$
begin
  alter table irma.agreements enable row level security;
  drop policy if exists tenant_isolation on irma.agreements;
  create policy tenant_isolation on irma.agreements
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
