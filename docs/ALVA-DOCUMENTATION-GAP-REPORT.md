# ALVA Documentation Gap Report

> Auto-genererad av `@pixdrift/doc-intel` från den maskinläsbara
> kapabilitetsinventeringen och täckningsmatrisen. **Kör inte handboken från
> antaganden** — denna rapport är kontrollpunkten över vad som faktiskt finns,
> vad som är dokumenterat, och vad som inte kan verifieras härifrån.

Genererad: 2026-08-23T00:22:08.030Z
Repo: kansli (Pixdrift platform hub) @ cursor/pixdrift-shared-auth-39a5

> PHASE 0 inventory. The ALVA diagnosis PRODUCT is NOT in this repository — it lives in its own (currently parked) repo. What exists here for ALVA is a single resource-server auth adapter. ALVA product capabilities are therefore recorded as NOT_PRESENT (unverifiable here), so unknown coverage is never masked as complete.

## Sammanfattning

| Mått | Antal |
| --- | ---: |
| Kapabiliteter totalt | 44 |
| I detta repo (`IN_REPO`) | 21 |
| I annat repo (`EXTERNAL_REPO`) | 0 |
| Ej närvarande här (`NOT_PRESENT`) | 23 |
| DOCUMENTED | 0 (0%) |
| PARTIALLY_DOCUMENTED | 18 |
| DRAFT | 0 |
| UNDOCUMENTED | 26 (59%) |
| VERIFICATION_REQUIRED | 0 |
| OUTDATED | 0 |
| ARCHIVED | 0 |

## "Vad i ALVA är odokumenterat just nu?"

- `platform.kansli.landing-login-gate` — Kansli landing page / login gate (Kansli (hub); UNDOCUMENTED; /, src/app/page.tsx)
- `platform.kansli.taskboard` — Kansli task board (list/add/toggle/delete) (Kansli (hub); UNDOCUMENTED; /api/tasks, /api/tasks/[id])
- `platform.kansli.logout` — Kansli logout (clears BFF session) (Kansli (hub); UNDOCUMENTED; /api/auth/logout, src/app/api/auth/logout/route.ts)
- `alva.product.vehicles` — Vehicles (Vehicles; UNDOCUMENTED) — _ALVA product source not in this repository; asserted in the request, cannot be verified here_
- `alva.product.work-orders` — Work orders (Work Orders; UNDOCUMENTED) — _Not in repo. Entity model to document (must NOT teach 1 work order = 1 diagnosis): Vehicle -> Work Order -> Customer Complaint -> Diagnosis Session -> Diagnosis Protocol_
- `alva.product.customer-complaints` — Customer complaints (multiple per work order) (Customer Complaints; UNDOCUMENTED) — _Not in repo. Each complaint owns its own independent diagnosis session/protocol_
- `alva.product.diagnosis-sessions` — Diagnosis sessions (Diagnosis Sessions; UNDOCUMENTED) — _Not in repo. Candidate for the first vertical slice once the ALVA repo is available_
- `alva.product.diagnosis-protocols` — Diagnosis protocols (print/export) (Diagnosis Protocols; UNDOCUMENTED) — _Not in repo_
- `alva.product.measurements-tests` — Measurements & tests (Measurements & Tests; UNDOCUMENTED) — _Not in repo_
- `alva.product.evidence-media` — Evidence & media (images) (Evidence & Media; UNDOCUMENTED) — _Not in repo_
- `alva.product.search-history` — Search & history (Search & History; UNDOCUMENTED) — _Not in repo_
- `alva.product.reports-export` — Reports & export (Reports & Export; UNDOCUMENTED) — _Not in repo_
- `alva.product.administration` — Administration (Administration; UNDOCUMENTED) — _Not in repo; admin instructions require authentication and are not public_
- `alva.product.users-permissions` — Users & permissions (Users & Permissions; UNDOCUMENTED) — _Not in repo_
- `alva.product.integrations` — Integrations (Integrations; UNDOCUMENTED) — _Not in repo; internal integration details must not be exposed publicly_
- `alva.product.education-mode` — Education mode (ALVA Education; UNDOCUMENTED) — _Not in repo_
- `alva.product.academy` — ALVA Academy / Training Engine (ALVA Academy; UNDOCUMENTED) — _Not in repo; handbook<->training relationships to be modelled once available_
- `alva.product.teacher-guide` — Teacher guide (incl. assessment answers) (Teacher Guide; UNDOCUMENTED) — _Not in repo; teacher-only assessment answers must never leak publicly_
- `alva.product.student-guide` — Student guide (Student Guide; UNDOCUMENTED) — _Not in repo_
- `alva.product.simulation` — Simulation (Simulation; UNDOCUMENTED) — _Not in repo_
- `alva.product.assessment` — Assessment (Assessment; UNDOCUMENTED) — _Not in repo_
- `alva.product.account-licensing` — Account & licensing (Account & Licensing; UNDOCUMENTED) — _Not in repo; presence of billing/licensing in ALVA is unconfirmed_
- `alva.product.notifications` — Notifications (Notifications; UNDOCUMENTED) — _Not in repo_
- `alva.product.onboarding` — Onboarding (Getting Started; UNDOCUMENTED) — _Not in repo_
- `alva.product.settings` — Settings (incl. language) (Administration; UNDOCUMENTED) — _Not in repo_
- `alva.product.contextual-help` — In-product contextual help surface (Understanding ALVA; UNDOCUMENTED) — _Not in repo; requires hooking the ALVA UI to expose route/screen/role context_

## Kan inte verifieras härifrån (produktkällan saknas i detta repo)

Dessa efterfrågades i uppdraget men **ALVA-produktens källkod finns inte i detta
repo** (den bor i eget repo). De kan därför varken inventeras, screenshottas
eller dokumenteras mot verklig evidens härifrån — de är listade så att okänd
täckning aldrig maskeras som komplett.

### NOT_PRESENT (23)

- `alva.product.vehicles` — Vehicles (Vehicles; UNDOCUMENTED) — _ALVA product source not in this repository; asserted in the request, cannot be verified here_
- `alva.product.work-orders` — Work orders (Work Orders; UNDOCUMENTED) — _Not in repo. Entity model to document (must NOT teach 1 work order = 1 diagnosis): Vehicle -> Work Order -> Customer Complaint -> Diagnosis Session -> Diagnosis Protocol_
- `alva.product.customer-complaints` — Customer complaints (multiple per work order) (Customer Complaints; UNDOCUMENTED) — _Not in repo. Each complaint owns its own independent diagnosis session/protocol_
- `alva.product.diagnosis-sessions` — Diagnosis sessions (Diagnosis Sessions; UNDOCUMENTED) — _Not in repo. Candidate for the first vertical slice once the ALVA repo is available_
- `alva.product.diagnosis-protocols` — Diagnosis protocols (print/export) (Diagnosis Protocols; UNDOCUMENTED) — _Not in repo_
- `alva.product.measurements-tests` — Measurements & tests (Measurements & Tests; UNDOCUMENTED) — _Not in repo_
- `alva.product.evidence-media` — Evidence & media (images) (Evidence & Media; UNDOCUMENTED) — _Not in repo_
- `alva.product.search-history` — Search & history (Search & History; UNDOCUMENTED) — _Not in repo_
- `alva.product.reports-export` — Reports & export (Reports & Export; UNDOCUMENTED) — _Not in repo_
- `alva.product.administration` — Administration (Administration; UNDOCUMENTED) — _Not in repo; admin instructions require authentication and are not public_
- `alva.product.users-permissions` — Users & permissions (Users & Permissions; UNDOCUMENTED) — _Not in repo_
- `alva.product.integrations` — Integrations (Integrations; UNDOCUMENTED) — _Not in repo; internal integration details must not be exposed publicly_
- `alva.product.education-mode` — Education mode (ALVA Education; UNDOCUMENTED) — _Not in repo_
- `alva.product.academy` — ALVA Academy / Training Engine (ALVA Academy; UNDOCUMENTED) — _Not in repo; handbook<->training relationships to be modelled once available_
- `alva.product.teacher-guide` — Teacher guide (incl. assessment answers) (Teacher Guide; UNDOCUMENTED) — _Not in repo; teacher-only assessment answers must never leak publicly_
- `alva.product.student-guide` — Student guide (Student Guide; UNDOCUMENTED) — _Not in repo_
- `alva.product.simulation` — Simulation (Simulation; UNDOCUMENTED) — _Not in repo_
- `alva.product.assessment` — Assessment (Assessment; UNDOCUMENTED) — _Not in repo_
- `alva.product.account-licensing` — Account & licensing (Account & Licensing; UNDOCUMENTED) — _Not in repo; presence of billing/licensing in ALVA is unconfirmed_
- `alva.product.notifications` — Notifications (Notifications; UNDOCUMENTED) — _Not in repo_
- `alva.product.onboarding` — Onboarding (Getting Started; UNDOCUMENTED) — _Not in repo_
- `alva.product.settings` — Settings (incl. language) (Administration; UNDOCUMENTED) — _Not in repo_
- `alva.product.contextual-help` — In-product contextual help surface (Understanding ALVA; UNDOCUMENTED) — _Not in repo; requires hooking the ALVA UI to expose route/screen/role context_

### EXTERNAL_REPO

_Inga._

## Delvis dokumenterat / utkast

### DRAFT / PARTIALLY_DOCUMENTED (18)

- `platform.idp.discovery` — OIDC discovery document (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/.well-known/openid-configuration, packages/identity/src/server.ts)
- `platform.idp.jwks` — JWKS (public signing keys) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/jwks.json, packages/identity/src/keys.ts)
- `platform.idp.authorize-login` — Authorize endpoint + login page (Auth Code + PKCE) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/authorize, packages/identity/src/server.ts)
- `platform.idp.token` — Token endpoint (PKCE, single-use codes) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/token, packages/identity/src/server.ts)
- `platform.idp.userinfo` — Userinfo endpoint (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/userinfo, packages/identity/src/server.ts)
- `platform.idp.logout` — RP-initiated logout (open-redirect allowlist) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/logout, packages/identity/src/server.ts)
- `platform.idp.postgres-store` — Durable Postgres store + rotating ES256 key + client registry (Identity / SSO; PARTIALLY_DOCUMENTED; packages/identity/src/pg/store.ts, packages/identity/src/pg/bootstrap.ts)
- `platform.idp.onboarding-cli` — Module onboarding CLI (client registry, one line) (Identity / SSO; PARTIALLY_DOCUMENTED; packages/identity/scripts/onboard-module.ts)
- `platform.kansli.sso-login` — Kansli SSO login (BFF: login + callback) (Kansli (hub); PARTIALLY_DOCUMENTED; /api/auth/login, /api/auth/callback)
- `platform.kansli.idp-mount` — Co-located IdP mount under /idp (Kansli (hub); PARTIALLY_DOCUMENTED; /idp/[[...slug]], src/app/idp/[[...slug]]/route.ts)
- `platform.ai-core.router` — AI Core model router (heaviest model per provider, Claude-first failover) (AI Core; PARTIALLY_DOCUMENTED; packages/ai-core/src/router.ts, packages/ai-core/src/providers.ts)
- `platform.contracts` — Shared platform contracts (identity, authz, audit, automations) (Platform contracts; PARTIALLY_DOCUMENTED; packages/contracts/src/index.ts)
- `platform.auth-core` — Auth-core primitives (scrypt passwords, sessions, bcrypt->scrypt migration) (Identity / SSO; PARTIALLY_DOCUMENTED; packages/auth-core/src/index.ts)
- `integration.alva.token-verifier` — ALVA resource-server token verifier (Pixdrift JWKS, zero-dependency) (Integrations / ALVA; PARTIALLY_DOCUMENTED; integrations/alva/src/pixdrift-auth.mjs, integrations/alva/test/verifier.test.ts)
- `integration.rita.oidc-plugin` — RITA OIDC BFF plugin (jose, Fastify) (Integrations / RITA; PARTIALLY_DOCUMENTED; integrations/rita/)
- `integration.irma.oidc-adapter` — IRMA OIDC BFF adapter (jose) (Integrations / IRMA; PARTIALLY_DOCUMENTED; integrations/irma/)
- `integration.britt.bff-adapter` — BRITT BFF adapter (WebCrypto, CJS) (Integrations / BRITT; PARTIALLY_DOCUMENTED; integrations/britt/)
- `integration.tora.public-pkce` — TORA public PKCE client + resource (config-only) (Integrations / TORA; PARTIALLY_DOCUMENTED; integrations/tora/)

## Kräver verifiering / föråldrat

### VERIFICATION_REQUIRED

_Inga._

### OUTDATED

_Inga._

## Saknar kontextuell hjälp (in-repo)

### Utan contextual help (21)

- `platform.idp.discovery` — OIDC discovery document (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/.well-known/openid-configuration, packages/identity/src/server.ts)
- `platform.idp.jwks` — JWKS (public signing keys) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/jwks.json, packages/identity/src/keys.ts)
- `platform.idp.authorize-login` — Authorize endpoint + login page (Auth Code + PKCE) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/authorize, packages/identity/src/server.ts)
- `platform.idp.token` — Token endpoint (PKCE, single-use codes) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/token, packages/identity/src/server.ts)
- `platform.idp.userinfo` — Userinfo endpoint (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/userinfo, packages/identity/src/server.ts)
- `platform.idp.logout` — RP-initiated logout (open-redirect allowlist) (Identity / SSO; PARTIALLY_DOCUMENTED; /idp/logout, packages/identity/src/server.ts)
- `platform.idp.postgres-store` — Durable Postgres store + rotating ES256 key + client registry (Identity / SSO; PARTIALLY_DOCUMENTED; packages/identity/src/pg/store.ts, packages/identity/src/pg/bootstrap.ts)
- `platform.idp.onboarding-cli` — Module onboarding CLI (client registry, one line) (Identity / SSO; PARTIALLY_DOCUMENTED; packages/identity/scripts/onboard-module.ts)
- `platform.kansli.landing-login-gate` — Kansli landing page / login gate (Kansli (hub); UNDOCUMENTED; /, src/app/page.tsx)
- `platform.kansli.sso-login` — Kansli SSO login (BFF: login + callback) (Kansli (hub); PARTIALLY_DOCUMENTED; /api/auth/login, /api/auth/callback)
- `platform.kansli.taskboard` — Kansli task board (list/add/toggle/delete) (Kansli (hub); UNDOCUMENTED; /api/tasks, /api/tasks/[id])
- `platform.kansli.logout` — Kansli logout (clears BFF session) (Kansli (hub); UNDOCUMENTED; /api/auth/logout, src/app/api/auth/logout/route.ts)
- `platform.kansli.idp-mount` — Co-located IdP mount under /idp (Kansli (hub); PARTIALLY_DOCUMENTED; /idp/[[...slug]], src/app/idp/[[...slug]]/route.ts)
- `platform.ai-core.router` — AI Core model router (heaviest model per provider, Claude-first failover) (AI Core; PARTIALLY_DOCUMENTED; packages/ai-core/src/router.ts, packages/ai-core/src/providers.ts)
- `platform.contracts` — Shared platform contracts (identity, authz, audit, automations) (Platform contracts; PARTIALLY_DOCUMENTED; packages/contracts/src/index.ts)
- `platform.auth-core` — Auth-core primitives (scrypt passwords, sessions, bcrypt->scrypt migration) (Identity / SSO; PARTIALLY_DOCUMENTED; packages/auth-core/src/index.ts)
- `integration.alva.token-verifier` — ALVA resource-server token verifier (Pixdrift JWKS, zero-dependency) (Integrations / ALVA; PARTIALLY_DOCUMENTED; integrations/alva/src/pixdrift-auth.mjs, integrations/alva/test/verifier.test.ts)
- `integration.rita.oidc-plugin` — RITA OIDC BFF plugin (jose, Fastify) (Integrations / RITA; PARTIALLY_DOCUMENTED; integrations/rita/)
- `integration.irma.oidc-adapter` — IRMA OIDC BFF adapter (jose) (Integrations / IRMA; PARTIALLY_DOCUMENTED; integrations/irma/)
- `integration.britt.bff-adapter` — BRITT BFF adapter (WebCrypto, CJS) (Integrations / BRITT; PARTIALLY_DOCUMENTED; integrations/britt/)
- `integration.tora.public-pkce` — TORA public PKCE client + resource (config-only) (Integrations / TORA; PARTIALLY_DOCUMENTED; integrations/tora/)

## Dokumenterat

### DOCUMENTED

_Inga._


---

_Nästa steg för att gå från denna kontrollpunkt till faktisk handbok kräver
åtkomst till ALVA-produktens repo + en körbar ALVA-instans (för snapshot-
pipelinen). Se `docs/DOCUMENTATION-INTELLIGENCE.md`._
