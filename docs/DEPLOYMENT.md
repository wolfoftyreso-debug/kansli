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
| **kansli (nav) + IdP** | https://kansli-git-cursor-pixdrift-shared-auth-39a5-hypbit.vercel.app | **Live** (Vercel, auto-deploy på varje push) |
| Pixdrift IdP | samma host, under `/idp` (t.ex. `…/idp/.well-known/openid-configuration`) | **Live så fort Postgres + env är satta** (se nedan) |

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

Utan `DATABASE_URL` faller `/idp` tillbaka på en in-memory-store per instans —
det räcker för `pnpm dev` (en process) men **inte** för serverless på Vercel
(flera instanser delar inte minne). Postgres krävs alltså i drift.

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
APP_ENV=prod                                # fail-closed: kräver starkt SESSION_SECRET
# DATABASE_URL sätts automatiskt av Vercel Postgres-integrationen
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

## 5. Verifieringschecklista (efter Postgres + env)

| Kontroll | URL/kommando | Förväntat |
| --- | --- | --- |
| kansli live | `https://<host>/` | Inloggningsgrind renderas |
| IdP hälsa | `https://<host>/idp/halsa` | `{"status":"ok","lage":"drift"}` |
| OIDC discovery | `https://<host>/idp/.well-known/openid-configuration` | `issuer` = `https://<host>/idp` |
| JWKS | `https://<host>/idp/jwks.json` | ES256-nyckel, stabil `kid` (persisterad i Postgres) |
| SSO-flöde | Klicka "Logga in med Pixdrift" på kansli | Login → callback → inloggad |

CI (`.github/workflows/ci.yml`) kör lint/typecheck/test (inkl. Postgres) på varje
push så att varje ny modul håller samma kvalitetsgrind.
