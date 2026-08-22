# @pixdrift/identity

Self-hosted OIDC identity provider for the Pixdrift family (Authorization Code +
PKCE, ES256/JWKS, userinfo, RP-logout). Two run modes.

## Dev (in-memory)

```bash
pnpm --filter @pixdrift/identity start   # http://127.0.0.1:4000
```

Seeded demo tenant + a generated per-boot key. Fast, but tokens/sessions do not
survive a restart. Fine for local work and tests.

## Durable (PostgreSQL)

Runtime state lives in Postgres with the RITA owner/app split: the **owner**
owns the schema and runs migrations/bootstrap; the **app** role connects at
runtime and owns nothing.

```bash
# one-time roles + databases (as a superuser)
createuser pixdrift_owner --login --pwprompt
createuser pixdrift_app   --login --pwprompt
createdb  pixdrift_idp    --owner pixdrift_owner

# boot: bootstrap runs when an owner URL is present (schema, grants, seed,
# client registry, signing key), then the app role serves.
DATABASE_URL='postgres://pixdrift_app:...@host/pixdrift_idp' \
PIXDRIFT_DB_OWNER_URL='postgres://pixdrift_owner:...@host/pixdrift_idp' \
ISSUER='https://id.pixdrift.com' \
SESSION_SECRET='<32+ chars>' \
pnpm --filter @pixdrift/identity start
```

On later boots omit `PIXDRIFT_DB_OWNER_URL`; the app role loads the client
registry and the persisted signing key. The key's `kid` is stable across
restarts, so issued tokens keep verifying.

### Onboarding a new module = one registry row

```sql
insert into oauth_clients (client_id, name, client_secret_hash, redirect_uris, audiences)
values ('nymodul-web', 'Ny modul', '<sha256(secret) base64, or null for a public PKCE client>',
        '["https://nymodul/auth/pixdrift/callback"]'::jsonb, '["nymodul-api"]'::jsonb);
```

No IdP code change. Restart (or reload) picks it up.

### Key rotation

Insert a new `active` key; the previous key's public JWK stays published (via
`otherPublicJwks`) until old tokens expire, then set its `status` to `retired`.

## Security notes

- **Owner/app split + narrow grants** (see `src/pg/schema.ts`): the app role has
  no DDL, cannot write orgs/users/clients/keys, may only update
  `users.password_hash` and read/write `auth_codes`.
- **RLS** is the subsystems' tool for isolating *customer* data per tenant. The
  IdP's tables are platform-global (auth reads across all users), so org-scoped
  RLS would be a no-op here; the privilege split is the protection.
- The signing private key is stored as PKCS#8 in `signing_keys`. In a hardened
  deployment, hold it in a KMS/secret manager and load it at boot instead.
