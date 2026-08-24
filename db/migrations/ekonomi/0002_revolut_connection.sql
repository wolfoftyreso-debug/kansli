-- Durable OAuth connections to external financial providers.
--
-- Token material is stored encrypted (AES-256-GCM, same wrap key as
-- ekonomi.connectors). Plaintext never reaches this table. One row per
-- org + provider + environment, so a sandbox connection can never be mistaken
-- for the production one.

create table if not exists integration_connections (
  id text primary key,
  org_ref text not null,
  provider text not null check (provider in ('revolut_business')),
  environment text not null check (environment in ('sandbox', 'production')),
  status text not null
    check (status in (
      'not_configured',
      'pending_authorization',
      'active',
      'action_required',
      'revoked',
      'error'
    )),
  external_account_reference text,
  encrypted_access_token text,
  encrypted_refresh_token text,
  access_token_expires_at timestamptz,
  scopes text[] not null default '{}',
  -- Set while a refresh holds the advisory lock. Observability only; the lock
  -- itself is authoritative, so a dead process cannot wedge the connection.
  refresh_lock_at timestamptz,
  last_success_at timestamptz,
  last_refresh_at timestamptz,
  last_error_code text,
  last_error_at timestamptz,
  connected_at timestamptz,
  connected_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_ref, provider, environment)
);

create index if not exists integration_connections_org_idx
  on integration_connections (org_ref, provider);

-- Short-lived OAuth state. Bound to org, actor and the exact redirect URI that
-- was registered, single use, with an expiry.
create table if not exists integration_oauth_states (
  state text primary key,
  org_ref text not null,
  provider text not null,
  environment text not null,
  actor_ref text not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists integration_oauth_states_expiry_idx
  on integration_oauth_states (expires_at);
