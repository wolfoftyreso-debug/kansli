# PIXDRIFT — System Environment Evaluation

Hard evaluation of the full environment brought up against a **real PostgreSQL**
(not the in-memory dev fallback). Method: stand up Postgres with the production
owner/app split, run the whole stack (kansli + co-located IdP under `/idp`),
enable the gated integration tests, and hard-test functionality, security and
persistence end to end.

Date: 2026-08-23. Repo: `kansli` @ branch `cursor/pixdrift-shared-auth-39a5`.

## Environment brought up

- **PostgreSQL 16**, owner/app privilege split (`pixdrift_owner` owns schema and
  runs migrations; `pixdrift_app` connects at runtime and owns nothing).
- Databases: `pixdrift_idp` (runtime), `pixdrift_idp_test` (integration).
- One command each: `scripts/dev-postgres.sh` (DB), `scripts/dev-up.sh` (full
  stack with wired env + auto-bootstrap + demo seed), `scripts/verify-env.sh`
  (health checks).
- IdP boots with `PgStore`: schema + grants applied, rotating **ES256** key
  persisted, DB-backed client registry, demo tenant seeded.

## Automated tests — 91/91 (with the DB engaged)

The three previously-skipped **Postgres integration tests now run and pass**
against the real DB:

- Full Authorization Code + PKCE flow off Postgres; contract-shaped claims
  (`sub`, `org.tier=enterprise`, two memberships).
- DB-backed client registry (`loadClients`) drives the server.
- Signing-key persistence across a simulated restart (same `kid`, JWKS stable).
- Authorization codes single-use in Postgres.

All other suites (identity flow, auth-core, contracts, ai-core incl. gateway,
doc-intel, integration adapters) remain green.

## Hard end-to-end + security (Postgres-backed)

<TextReference
 path="/opt/cursor/artifacts/pixdrift_hard_e2e_postgres.log"
 start={1}
 end={8}
 alt="Hard E2E + security results against Postgres"
></TextReference>

| # | Check | Result |
| --- | --- | --- |
| 1 | JWKS `kid` stable (persisted) | pass |
| 2 | SSO happy path → `/kansli` signed in, session cookie set | pass |
| 3 | Reused authorization code rejected at `/idp/token` (401) | pass |
| 4 | Wrong password → login page, no code | pass |
| 5 | Brute-force throttle → 429 after repeated failures | pass |
| 6 | SSO session reuse → 2nd authorize issues a code without the form | pass |

**Key persistence across a full stack restart:** the signing-key `kid` is
identical before and after restarting the server against the same DB — the key is
loaded from Postgres, never regenerated. This is exactly what makes SSO reliable
across multiple serverless instances (all load the same key → JWKS stable → tokens
verify).

## Components — status

| Component | Status | Evidence |
| --- | --- | --- |
| IdP (OIDC) on Postgres | Verified | integration tests + hard E2E + restart persistence |
| kansli BFF + SSO (`/kansli`) | Verified | happy path → signed-in hub |
| Co-located `/idp` mount | Verified | discovery/JWKS/health + full flow |
| Public PIXDRIFT site | Verified | `verify-env.sh` all 200; prior visual QA |
| AI Core (heaviest model, Claude-first failover) | Verified | unit + runtime demo |
| AI Gateway (100+ models) | Ready, unverified live | needs `AI_GATEWAY_API_KEY`/OIDC token |
| Documentation Intelligence / Product Demo engines | Verified (kernel) | gap reports + tests |

## Gaps, risks and honest limitations

- **Live (Vercel) auth is still down** until Vercel Postgres + env are set — the
  IdP fail-closes in production without `SESSION_SECRET`/DB (by design). Verified
  locally against Postgres; the live path needs the two dashboard actions in
  `docs/DEPLOYMENT.md`.
- **Per-instance brute-force throttle** is in-memory; multi-instance production
  should back it with Redis (already noted in the security review). Not a
  correctness issue; a hardening item.
- **Signing key at rest** is stored in Postgres; production should wrap it with a
  KMS/During-rotation policy (noted in `docs/INVENTORY.md`).
- **AI Gateway** cannot be verified until a credential exists; the code path,
  model listing and slug format are unit-tested.
- **The family products (ALVA/RITA/TORA/BRITT/IRMA)** are not in this repo — the
  `/systems/*` pages are catalog entries, not runnable apps. No product-level
  auth to test beyond the shared identity.

## Reproduce

```bash
scripts/dev-postgres.sh                 # start Postgres (owner/app, 2 DBs)
# run the gated integration tests against the real DB:
export PIXDRIFT_TEST_OWNER_URL='postgres://pixdrift_owner:ownerpw@127.0.0.1:5433/pixdrift_idp_test'
export PIXDRIFT_TEST_DATABASE_URL='postgres://pixdrift_app:apppw@127.0.0.1:5433/pixdrift_idp_test'
pnpm test
BUILD=1 scripts/dev-up.sh               # full stack on :3000 (Postgres-backed)
scripts/verify-env.sh                    # health checks
```

## Conclusion

The complete environment runs end-to-end on a real database with authentication
fully wired: SSO works, tokens verify, the signing key and client registry
persist, and the security controls (PKCE, single-use codes, redirect allowlist,
throttle, fail-closed prod) hold under hard testing. The remaining work to make
the **public** environment fully live is operational (Vercel Postgres + env), not
functional, and the product apps await their own repositories.
