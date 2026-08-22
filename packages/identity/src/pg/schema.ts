/**
 * IdP schema (owner-applied) + least-privilege grants for the app role.
 *
 * The owner/app split is RITA's proven pattern: `pixdrift_owner` owns the schema
 * and runs migrations; `pixdrift_app` connects at runtime and owns nothing.
 *
 * A note on RLS: RITA/ALVA/IRMA use row-level security to isolate *customer*
 * data per tenant. The IdP's own tables are platform-global — authentication
 * must read across all users/orgs — so an org-scoped RLS policy would be a
 * no-op here. The real protection is the privilege split + narrow grants below
 * (the app cannot DDL, cannot write orgs/users/clients/keys, and can only touch
 * the columns and tables it needs). Keep it that way.
 */

export const SCHEMA_SQL = `
create table if not exists organizations (
  id text primary key,
  name text not null,
  country text not null,
  is_demo boolean not null default false,
  tier text not null default 'free',
  created_at timestamptz not null default now()
);

create table if not exists legal_entities (
  id text primary key,
  org_id text not null references organizations(id) on delete cascade,
  name text not null,
  registration_number text not null,
  country text not null
);

create table if not exists roles (
  key text primary key,
  label text not null,
  scope text not null,
  permissions jsonb not null default '[]'::jsonb
);

create table if not exists users (
  id text primary key,
  email text not null,
  display_name text not null,
  status text not null default 'active',
  password_hash text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists users_email_lower_idx on users (lower(email));

create table if not exists memberships (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  org_id text not null references organizations(id) on delete cascade,
  role_keys jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, org_id)
);

create table if not exists oauth_clients (
  client_id text primary key,
  name text not null,
  client_secret_hash text,
  redirect_uris jsonb not null default '[]'::jsonb,
  post_logout_redirect_uris jsonb not null default '[]'::jsonb,
  audiences jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists auth_codes (
  code text primary key,
  client_id text not null,
  user_id text not null,
  org_id text,
  redirect_uri text not null,
  code_challenge text not null,
  nonce text,
  scope text not null default 'openid',
  expires_at timestamptz not null
);

create table if not exists signing_keys (
  kid text primary key,
  alg text not null,
  private_pkcs8 text not null,
  public_jwk jsonb not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
`;

/** Narrow, explicit grants for the runtime app role. Run as owner. */
export function grantsSql(appRole: string): string {
  // The role name is interpolated (GRANT cannot be parameterised), so it must be
  // a plain SQL identifier — never attacker-controlled free text.
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(appRole)) {
    throw new Error(`ogiltigt appRole (måste vara en SQL-identifierare): ${appRole}`);
  }
  return `
grant usage on schema public to ${appRole};
grant select on organizations, legal_entities, roles, users, memberships, oauth_clients, signing_keys to ${appRole};
grant update (password_hash) on users to ${appRole};
grant select, insert, delete on auth_codes to ${appRole};
`;
}
