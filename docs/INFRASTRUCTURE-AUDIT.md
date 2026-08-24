# Infrastrukturrevision — Pixdrift / kansli

Datum: 2026-08-24. Referens: tysk industriell ordning (Siemens / Volkswagen AG
som kund). Allt nedan är läst ur kod i det här repot, inte ur målbilder.

**Regel:** Applikationen får gå sönder. Kundens data får inte gå sönder.
(`docs/ARCHITECTURE-CONSTITUTION.md` art. 3.)

Enkel ritning (för en människa som inte läser kod):
`docs/architecture/hur-det-fungerar.html`.

Driftskarta (svensk, kort): `docs/FAMILY.md`.
Kodlista: `docs/INVENTORY.md`.

---

## 1. Domen — vad är det här?

Ett nav. Inte sex produkter i sex moln.

Koden lever i **ett** Next.js-16-hus (`kansli` 0.1.0). I huset sitter:

1. den publika sajten
2. inloggningen (`/idp`)
3. kansliet
4. sex verktyg (TORA, RITA, BRITT, IRMA, TYRA, ALVA)
5. plattforms-API:t

Databasen är **en** Postgres. Varje verktyg äger sitt schema. De synkar via
`platform.events`. De skriver inte i varandras tabeller.

Live (dokumenterat): `https://kansli.vercel.app` mot Neon Postgres.

---

## 2. Exakt hur det fungerar

```
Människa
  → webbläsare
      → Next.js (en process, Vercel Fluid / lokalt :3000)
           /               publik sajt
           /idp            Pixdrift Identity (OIDC, Fastify via inject)
           /api/auth/*     BFF: login, callback, logout
           /kansli         nav + uppgifter
           /tora /rita /britt /irma /tyra /alva
           /platform       karta + hälsa
           /api/{system}/* JSON, samma session
           /api/tyra/cron/reminders   07:00 UTC
      → PostgreSQL
           public      users, orgs, clients, signing_keys
           platform    events          (händelseboken)
           kansli      tasks
           tora        market_snapshots
           rita        analyses
           britt       observations, findings, metric_snapshots
           irma        agreements
           tyra        customers, vehicles, tire_cases, outbox, …
           alva        cases
```

### Inloggning (samma nyckel)

1. `/api/auth/login` startar OIDC Authorization Code + PKCE.
2. IdP under `/idp` visar formuläret, skriver SSO-cookie `pixdrift_idp`.
3. Callback byter kod mot token och sätter httpOnly-cookie `kansli_session`
   (HS256, 8 timmar).
4. Produkter läser sessionen. De har **ingen** NextAuth och ingen egen login.
5. Server actions går via `requireOrgAction`. API via `requireOrg`.

Kod: `packages/identity`, `packages/auth-client`, `packages/auth-core`,
`src/lib/auth/*`, `src/app/api/auth/*`, `src/app/idp/[[...slug]]/route.ts`.

### API-kärna

`@pixdrift/api-core` ger felmodell, `requireActor`, `requireOrg`.
`@pixdrift/events` är append-only-loggen. BRITT lyssnar i processen
(`src/lib/sync/handlers.ts`). Inget system skriver i BRITT:s tabeller utom BRITT.

### AI

`@pixdrift/ai-core` har failover `anthropic → openai → gemini → kimi → gateway`.
Svaret är **inferens**, aldrig sanning. RITA:s motor fejkars inte: utan host
eller binär blir status `blocked`.

---

## 3. Byggt med vilken kod (versioner)

| Del | Version / pin | Var det låses |
| --- | --- | --- |
| Node | ≥ 22 | `package.json` `engines` + CI `node-version: 22` |
| pnpm | 10.33.3 | `packageManager` + CI |
| Next.js | 16.3.2 | root `package.json` |
| React | 19.2.8 | root |
| TypeScript | ^5 | root |
| Postgres-klient | pg 8.13.1 | root + `@pixdrift/db` |
| Fastify (IdP) | ^5.2.1 | identity + root |
| jose | ^6.0.11 | identity, auth-client |
| Zod | ^4.1.13 | contracts, rita-engine, doc-intel |
| Workspace-paket | `workspace:*` | pnpm-lock.yaml |

`pnpm install --frozen-lockfile` i CI. Löst `^` på en del runtime-deps är
medvetet inom major; lockfilen är sanningen vid install.

Paket i `packages/`: `systems`, `events`, `db`, `api-core`, `contracts`,
`auth-core`, `auth-client`, `identity`, `ai-core`, `tora`, `rita-engine`,
`doc-intel`.

Adaptrar i `integrations/` är för **andra** repon. De ersätter inte modulerna
i `src/`.

---

## 4. Mognad — procent mot uttalat jobb

Procenten är inte “hur mycket kod”. Den är: *skulle en VW-anläggning betala för
det här jobbet i drift, utan att vi låtsas?* 100 % = uttalat jobb, restore
övad, falldown känd, inga låtsasmotorer.

| System | Katalogstatus | % | Vad som faktiskt går | Vad som saknas |
| --- | --- | ---: | --- | --- |
| Identity | operational | **82** | OIDC live, JWKS, demo-SSO, durable store, prod-fail-closed BFF | Nyckel i KMS, delad rate-limit, multi-region |
| Kansli | operational | **76** | Session, uppgifter, plattforms-API, chrome i tokens | Inte ett kontors-OS |
| Händelsebok | — | **84** | Append-only, org-scope även i events-API | Ingen separat worker-kö |
| API-core / auth-core | — | **82** | En felmodell, en authz | `requirePermission` oanvänd i routes |
| AI-core | — | **68** | Failover + gateway | Används som verktyg, inte produkt |
| Publik sajt | — | **86** | Tokens, katalog, ärlig copy | — |
| TORA | pilot | **58** | Motor i processen, GET utvärderar, POST sparar | Alltid Exempelbolaget |
| IRMA | pilot | **60** | Handslag L0–L1, återutfärda, export, immutability | Filarkiv, högre nivåer, WAF |
| TYRA | pilot | **50** | Ärende + hub + kundkort + hjulset-rad | Live-lager/offert/SMS, inspektionsskrivning |
| RITA | pilot | **56** | Skattjakt + fyndkort (kategori, regel, disclaimer) | HTTP-host på Vercel, kund-upload |
| BRITT | pilot | **46** | Inbox med djuplänk och uppdragskarta | Livebokföring, observationsstatus |
| ALVA | deferred | **26** | Intag + detalj, ingen diagnos | Guidning och protokoll (ALVA-repot) |
| Backup / DR | — | **35** | Lokal+CI restore-drill | Neon-restore i produktion inte övad |
| Säkerhetsställning | — | **70** | OIDC, httpOnly, headers, CSP report-only, org-scope | WAF, KMS, delad throttle |

**Familjen som driftad plattform: 56 %.**

Hårdaste genomgången: `docs/CRITICAL-REVISION.md`.

Kärnan (identity + nav + eventlogg) bär. Produkterna är skivor, inte färdiga
affärssystem. Det är det ärliga läget.

---

## 5. Design och typsnitt

En familj. Inte sju varumärken.

- Typsnitt: **Geist Sans** + **Geist Mono** i `src/app/layout.tsx`.
- Färg: ink-on-paper i `src/app/globals.css` (`--color-paper`, `--color-ink`,
  en accent `#1f4b8f`).
- Chrome: `AppShell` för inloggade ytor.
- TYRA har `--tyra-*` men de **pekar på samma PIXDRIFT-tokens**. Ingen mörk
  sidospår.
- IRMA gästsida använder samma papper/ink, ingen egen font.
- Publik sajt: samma tokens, egna site-komponenter.

Bedömning: **matchar**. Avvikelse som ska hållas: aldrig införa ett tredje
typsnitt eller en mörk TYRA-hud i navet.

---

## 6. Auth och API — är det orkestrerat?

Ja, för det som körs i det här huset.

- En IdP, en BFF-session, en `requireOrg`.
- En eventkatalog i `@pixdrift/systems`.
- En synklyssnare.
- Produkter har samma fyra ytor (lib, UI, API, migration). Kontraktstestet
  faller om en yta saknas.

Adaptrarna i `integrations/` är för fristående repon. De är inte navets
körväg. ALVA-adaptern är vilande. Det är i sin ordning så länge ingen tror
att ALVA-diagnos körs här.

---

## 7. Versioner — har vi kontroll?

**Ja, tillräckligt för navet. Inte för en AWS-fabrik.**

- Lockfil + frozen install i CI.
- Node 22 pin i CI och `engines`.
- Workspace-paket versionsätts tillsammans.

Lucka: flera runtime-deps står med `^`. Det är normalt i JS. Sanningen är
lockfilen. Byt inte Next/React utan migrationsguide.

---

## 8. Säkerhet — är vi “inte exponerade för hackers”?

**Nej. Ingen är det.** Vi är inte slarviga. Vi är inte färdiga.

### Det som håller

- Ingen NextAuth. PKCE. httpOnly. `SameSite=lax`.
- `safeNextPath` mot open redirect.
- Hub-/IRMA-token hashas. Klartext en gång, kort cookie.
- IdP vägrar svag `SESSION_SECRET` i prod.
- RITA-subprocess får inte databashemligheter.
- Cron utan `CRON_SECRET` → 401.
- Modellkatalog `GET /api/platform/ai` kräver session (2026-08-24).
- Browser-headers: `nosniff`, `DENY` frame, referrer, permissions-policy
  (`src/lib/platform/security-headers.ts`, `next.config.ts`).
- `X-Powered-By` av.

### Det som saknas mot VW-bar

- Ingen Vercel WAF / Attack Mode i repo-config.
- Ingen KMS för signeringsnyckel (ligger i Postgres).
- Login-throttle är **per instans** (minne). Flera Function-instanser delar
  inte räknare.
- Ingen CSRF-token utöver SameSite + server actions.
- Ingen testad Neon-restore i produktion.
- Publik `GET /api/platform/health` är medvetet öppen (ping). Den avslöjar
  om gateway/RITA är konfigurerad, inte nycklar.

Demo-kontot är en **demo**. Det ska inte finnas i en kundmiljö utan
`PIXDRIFT_SEED_DEMO`.

---

## 9. Falldown — har vi det på allt?

**Nej.**

| Yta | Falldown idag |
| --- | --- |
| AI-anrop | Ja. Nästa provider i kedjan. |
| AI-gateway-auth | Ja. API-nyckel, annars Vercel OIDC. |
| RITA-motor | Ärlig `blocked`. Ingen fake. |
| TYRA-påminnelse | Ärlig `BLOCKED`. Inget låtsas-SMS. |
| TYRA-leverantör | `NOT_CONFIGURED`. |
| Postgres | Ingen app-failover. Neon sköter HA. En `DATABASE_URL`. |
| IdP utan databas | In-memory. **Förbjudet i drift.** |
| Cron | En Vercel-cron. Missad körning köas inte om. |

Det är rätt att sakna fake. Det är fel att påstå att “allt har falldown”.

---

## 10. Backup — har vi tät backup?

**Före den här revisionen: nej i repot.** Konstitutionen räknar inte backup
förrän restore är testad. Neon har PITR som **leverantörskapacitet**. Vi hade
ingen övning.

**Nu i repot:**

- `pnpm db:backup` → `scripts/backup-postgres.sh`
- `pnpm db:restore-drill` → dump, återställ i tillfällig databas, släng
- CI kör restore-drill efter testerna

**Fortfarande nej för produktion:** ingen dokumenterad Neon-konsol-övning med
klockslag och ansvarig. Det är nästa reservövning, inte mer kod.

---

## 11. Vad den här revisionen byggde (utan att fråga)

Volkswagen-regeln: sluta det som är sant, litet och verifierbart. Hitta inte
på motorer.

1. Säkerhetshuvuden på alla svar.
2. AI-katalog kräver inloggad org.
3. `engines.node >= 22`.
4. Restore-drill + CI-steg.
5. Saknade env-namn i `.env.example`.
6. Den här filen + ritningen.
7. Events-API org-scope, prod-hemligheter, CSP report-only, hashad IRMA-throttle.
8. TYRA hjulset + kundkort, IRMA återutfärda, RITA-fyndkort, ALVA-intag,
   BRITT-djuplänkar. Se `docs/CRITICAL-REVISION.md`.

Inte byggt (medvetet): SMS-adapter, live-pris, ALVA-diagnos, BankID, Redis,
AWS-IaC, fejkad RITA på Vercel.

---

## 12. Vad vi gör härnäst

Ordning som en anläggnings-IT-chef skulle skriva på tavlan.

1. **Neon restore-övning i produktion.** En människa återställer en kopia,
   antecknar tid och resultat i `DEPLOYMENT.md`. Utan det är DR 35 %, inte 80.
2. **RITA HTTP-host** om RITA ska köras på Vercel. Binären ryms inte i
   Function. Utan host förblir RITA lokal/pilot.
3. **KMS eller minst encrypted-at-rest-bevis** för IdP-nyckeln.
4. **Vercel WAF** på `kansli` (managed rules + rate limit mot `/idp` och
   `/api/auth`). Inte mer Redis i appen utan art. 6-beslut.
5. **TYRA sändadapter** först när 46elks/Resend är ett medvetet val — då
   outbox `SENT`, inte förr.
6. **ALVA-repo** eller ALVA stannar deferred. Registrera fall är inte diagnos.
7. **IRMA-filer** bara om objektlagring (Blob) tas in som godkänt datastore.
8. **Adaptrar mot fristående repon** hålls vilande tills de repona körs mot
   denna IdP på riktigt.

Gör inte: fler produkter, fler fonter, fler “demo-live”-vägar.

---

## 13. Svar på de raka frågorna

| Fråga | Svar |
| --- | --- |
| Vet vi exakt vad vi har? | Ja. Den här filen + `FAMILY.md` + `INVENTORY.md`. |
| Vet vi hur det fungerar? | Ja. Ett hus, en login, sex pärmar, en händelsebok. |
| Matchar design? | Ja. Geist + ink-on-paper. TYRA är alias, inte avstickare. |
| Delas auth och API-core? | Ja, i navet. |
| Versioner under kontroll? | Ja via lockfil och CI. |
| Säkert mot hackers? | Hårt för ett nav. Inte färdigt mot VW-bar. |
| Falldown på allt? | Nej. AI ja. Data och IdP: leverantör + ärlig block. |
| Tät backup? | Drill i repo/CI. Produktion (Neon) inte övad. |
| Vad härnäst? | Avsnitt 12, i den ordningen. |
