alter table agreements
  add column if not exists token_expires_at timestamptz,
  add column if not exists token_revoked_at timestamptz,
  add column if not exists viewed_at timestamptz,
  add column if not exists verification_level smallint not null default 1,
  add column if not exists content_sha256 text;

update agreements
   set token_expires_at = created_at + interval '14 days'
 where token_hash is not null
   and token_expires_at is null;

create unique index if not exists agreements_token_hash_uidx
  on agreements (token_hash)
  where token_hash is not null;

alter table agreements drop constraint if exists agreements_status_chk;
alter table agreements add constraint agreements_status_chk
  check (status in ('draft', 'viewed', 'signed', 'expired', 'cancelled'));

alter table agreements drop constraint if exists agreements_level_chk;
alter table agreements add constraint agreements_level_chk
  check (verification_level in (0, 1));
