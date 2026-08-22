# Deployment & driftsättning

Två deploybara delar i dag: **kansli** (nav, Next.js) och **Pixdrift IdP**
(`@pixdrift/identity`, Node + Postgres). Boring-AWS-baslinjen nedan är målet för
hela familjen (konstitutionens artikel 4–5: managed services, motiverad
komplexitet).

> **Status i denna miljö:** ingen molnkredential finns (Vercel MCP = needsAuth,
> ingen `VERCEL_TOKEN`, ingen AWS). Deploy kan därför inte köras härifrån —
> se "Vad som krävs för länkar" sist. Allt nedan är verifierat lokalt.

## 1. kansli (nav) → Vercel

Next.js 16, redo för Vercel (`vercel.json`). Antingen Git-integration (koppla
repot i Vercel) eller CLI:

```bash
vercel link && vercel deploy --prebuilt   # eller push till kopplad branch
```

Miljövariabler (Production):

```
PIXDRIFT_ISSUER=https://id.pixdrift.com
PIXDRIFT_CLIENT_ID=kansli-web
PIXDRIFT_CLIENT_SECRET=<secrets store>
PIXDRIFT_REDIRECT_URI=https://<kansli-host>/api/auth/callback
APP_BASE_URL=https://<kansli-host>
APP_SESSION_SECRET=<32+ tecken>
COOKIE_SECURE=true
```

## 2. Pixdrift IdP → container + Postgres

IdP:n är en Node-tjänst (Fastify) med Postgres-lager (owner/app). Kör som en
container (ECS Fargate i mål-AWS; interimistiskt valfri container-host) mot RDS
PostgreSQL. Se `packages/identity/README.md`.

```
DATABASE_URL=postgres://pixdrift_app:...@<rds>/pixdrift_idp
PIXDRIFT_DB_OWNER_URL=postgres://pixdrift_owner:...@<rds>/pixdrift_idp   # endast vid bootstrap/migrering
ISSUER=https://id.pixdrift.com
SESSION_SECRET=<32+ tecken>
COOKIE_SECURE=true
```

Nya moduler registreras utan omdeploy: `pnpm onboard -- --id … --redirect … --audience …`
(eller en rad i `oauth_clients`).

## 3. Boring-AWS-baslinje (mål)

```
CloudFront → ALB → ECS Fargate (API · Workers · Scheduled jobs)
RDS PostgreSQL (Multi-AZ, PITR, snapshots, deletion protection)
ElastiCache Redis · S3 (versioning/Object Lock) · SQS · EventBridge
Secrets Manager · KMS · CloudWatch · AWS Backup (cross-region)
```

PostgreSQL = system of record; Redis = cache; S3 = filer; SQS = async. Inga
fler datastores utan arkitekturgodkännande (konstitutionen art. 6). IaC (art.
4/11) byggs när AWS-credentials finns; **backup räknas inte förrän restore är
testad** (art. 3): backup → restore → integrity check → application boot →
critical data verification, regelbundet.

## 4. Verifieringschecklista (efter deploy → detta ger länkarna)

| Kontroll | URL/kommando | Förväntat |
| --- | --- | --- |
| kansli live | `https://<kansli-host>/` | Inloggningsgrind renderas |
| IdP hälsa | `https://id.pixdrift.com/halsa` | `{"status":"ok","lage":"drift"}` |
| OIDC discovery | `https://id.pixdrift.com/.well-known/openid-configuration` | `issuer` matchar |
| JWKS | `https://id.pixdrift.com/jwks.json` | ES256-nyckel, stabil `kid` |
| SSO-flöde | Klicka "Logga in med Pixdrift" på kansli | Login → callback → inloggad |

## Vad som krävs för länkar (blockerare)

För att jag ska kunna deploya och lämna faktiska URL:er behövs något av:

- **Vercel:** autentisera Vercel-MCP:n i Cursor, eller lägg en `VERCEL_TOKEN` i
  Secrets — då deployar jag kansli och returnerar preview/prod-URL.
- **IdP-host:** AWS-credentials (för ECS+RDS enligt baslinjen), eller en enklare
  container-host, för `id.pixdrift.com`.

CI (`.github/workflows/ci.yml`) kör lint/typecheck/test (inkl. Postgres) på varje
push så att varje ny modul håller samma kvalitetsgrind.
