alter table agreements
  add column if not exists body text not null default '',
  add column if not exists clauses jsonb not null default '[]'::jsonb,
  add column if not exists signed_at timestamptz,
  add column if not exists signer_name text,
  add column if not exists signature_hash text,
  add column if not exists artifact_sha256 text;
