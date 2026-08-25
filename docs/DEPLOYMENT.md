# Deployment & driftsättning

**Beslut (Vercel):** IdP:n körs samlokaliserad i kansli-appen under `/idp` — **ett**
Vercel-projekt, **en** deploy, **en** uppsättning miljövariabler, med **Vercel
Postgres (Neon)** som datalager. Samma Fastify-IdP som testsviten kör drivs via
`app.inject()` från en catch-all route handler (`src/app/idp/[[...slug]]/route.ts`);
inga separata värdar eller sockets. OIDC-issuer blir `${APP_BASE_URL}/idp`.

Boring-baslinjen (AWS) i avsnitt 4 kvarstår som långsiktigt mål för hela
familjen; Vercel + Vercel Postgres är den valda driften nu (konstitutionens
art. 4–5: managed services, motiverad komplexitet).

## Live

| Del | URL | Status |
| --- | --- | --- |
| **kansli (nav) + IdP** | https://kansli.vercel.app | **LIVE** — SSO fungerar end-to-end (Neon Postgres) |
| Pixdrift IdP | https://kansli.vercel.app/idp (discovery, jwks, authorize/token/userinfo) | **LIVE** — Neon-backad, roterande ES256-nyckel persisterad |

Databas: **Neon Postgres** via Vercel Marketplace (resurs `neon-sky-island`),
provisionerad + kopplad via CLI/API. Env satt via Vercel-API. Demo-inloggning:
`demo@exempelbolaget.se` / `demo-losenord-1234`. Verifierat live: discovery, JWKS,
authorize → login → callback → inloggat `/kansli`.

Vercel-projekt: `kansli` (`prj_L8oHYD0UrqQMjQUaqnd96CUT3K7c`), team `hypbit`.
Navets landningssida renderas publikt (200). Hela SSO-flödet är verifierat
end-to-end lokalt mot `/idp` (Authorization Code + PKCE, discovery, JWKS,
token, userinfo, SSO-återanvändning, logout).

## 1. Sätt upp Vercel Postgres (2 klick i dashboarden)

Detta är det enda som inte kan göras från kod (kräver dashboard-åtgärd):

1. Vercel → projektet `kansli` → **Storage** → **Create Database** → **Postgres**
   (Neon). Koppla den till projektet. Vercel injicerar då automatiskt
   `DATABASE_URL` (och `POSTGRES_URL`) som miljövariabler.
2. Kör schema/bootstrap **en gång** (se avsnitt 3).

Utan `DATABASE_URL` faller `/idp` tillbaka på en in-memory-store **bara utanför
produktion**. Preview och `pnpm dev` får minneslagret. `VERCEL_ENV=production`
eller `APP_ENV=prod|production` vägrar starta utan Postgres, utan hemligheter
på minst 32 tecken, med `PIXDRIFT_SEED_DEMO=true` eller med `COOKIE_SECURE=false`.
`NODE_ENV=production` räknas inte som produktion (Vercel preview sätter den).

## 2. Miljövariabler (Production, projektet `kansli`)

Klistra in i Vercel → Settings → Environment Variables. `DATABASE_URL` kommer
från Postgres-integrationen ovan. Ersätt `<host>` med projektets domän.

```
# --- Kansli som OIDC-klient (BFF) ---
APP_BASE_URL=https://<host>
PIXDRIFT_ISSUER=https://<host>/idp
PIXDRIFT_CLIENT_ID=kansli-web
PIXDRIFT_CLIENT_SECRET=<KANSLI_CLIENT_SECRET>
PIXDRIFT_REDIRECT_URI=https://<host>/api/auth/callback
APP_SESSION_SECRET=<APP_SESSION_SECRET, 32+ tecken>
COOKIE_SECURE=true

# --- IdP:n under /idp ---
CLIENT_SECRET=<KANSLI_CLIENT_SECRET>        # måste vara SAMMA som PIXDRIFT_CLIENT_SECRET
REDIRECT_URIS=https://<host>/api/auth/callback
POST_LOGOUT_URIS=https://<host>/
SESSION_SECRET=<SESSION_SECRET, 32+ tecken>
APP_ENV=prod                                # fail-closed tillsammans med VERCEL_ENV=production
# DATABASE_URL sätts automatiskt av Vercel Postgres-integrationen
# Sätt inte PIXDRIFT_SEED_DEMO=true i Production — processen vägrar starta.
```

Andra moduler (ALVA, RITA, TORA, BRITT, IRMA) registreras via egna
`*_CLIENT_ID`/`*_CLIENT_SECRET`/`*_REDIRECT_URIS`-variabler (se
`packages/identity/src/boot.ts`) eller via `oauth_clients`-tabellen utan omdeploy.

## 3. Bootstrap av Postgres (en gång)

Schemat/nyckeln/klientregistret skapas av en **owner**-roll. Enklast:

- Sätt tillfälligt `PIXDRIFT_DB_OWNER_URL` (owner-connection) i env och gör en
  deploy. Vid boot kör IdP:n `pgBootstrap` (schema + grants + roterande ES256-
  nyckel + klientregister). Sätt `PIXDRIFT_SEED_DEMO=true` om demotenant/
  demoanvändare ska seedas. **Ta bort owner-URL:en efter bootstrap** — drift
  kör som app-rollen (`DATABASE_URL`).
- Alternativt kör migreringen separat som owner och registrera klienter med
  `pnpm onboard -- --id … --redirect … --audience …`.

**Kvitto 2026-08-25:** produkt-scheman (kansli, ekonomi, tora, rita, britt,
irma, tyra, alva) kördes mot Neon. `PIXDRIFT_SEED_DEMO` togs bort från
Production. `CRON_SECRET` sattes. TYRA-påminnelser läggs ändå bara i kö.

## 4. Boring-AWS-baslinje (långsiktigt mål)

```
CloudFront → ALB → ECS Fargate (API · Workers · Scheduled jobs)
RDS PostgreSQL (Multi-AZ, PITR, snapshots, deletion protection)
ElastiCache Redis · S3 (versioning/Object Lock) · SQS · EventBridge
Secrets Manager · KMS · CloudWatch · AWS Backup (cross-region)
```

PostgreSQL = system of record; Redis = cache; S3 = filer; SQS = async. Inga
fler datastores utan arkitekturgodkännande (konstitutionen art. 6). IaC (art.
4/11) byggs när AWS-credentials finns; **backup räknas inte förrän restore är
testad** (art. 3).

Lokal + CI-övning: `pnpm db:restore-drill` (`scripts/restore-drill.sh`) dumpar
ägardatabasen, återställer i en tillfällig databas och slänger den. Neon PITR
på produktion är leverantörens väg — den är inte övad från den här repot förrän
en person kör restore i Neon-konsolen och antecknar resultatet här.

## 5. Verifieringschecklista (efter Postgres + env)

| Kontroll | URL/kommando | Förväntat |
| --- | --- | --- |
| kansli live | `https://<host>/` | Systemkatalog + sidospår |
| hälsa | `https://<host>/api/platform/health` | `{"ok":true,"database":"up"}` i prod |
| IdP hälsa | `https://<host>/idp/halsa` | `{"status":"ok","lage":"drift"}` |
| OIDC discovery | `https://<host>/idp/.well-known/openid-configuration` | `issuer` = `https://<host>/idp` |
| JWKS | `https://<host>/idp/jwks.json` | ES256-nyckel, stabil `kid` (persisterad i Postgres) |
| SSO-flöde | Klicka "Logga in med Pixdrift" på kansli | Login → callback → inloggad |

CI (`.github/workflows/ci.yml`) kör lint/typecheck/test (inkl. Postgres) på varje
push så att varje ny modul håller samma kvalitetsgrind.
