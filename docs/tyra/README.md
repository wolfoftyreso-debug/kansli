# TYRA i kansli

Port från `wolfoftyreso-debug/TYRA` branch `cursor/tyra-instrument-ui-06e9`
(commit `82373ca`). Inte en git-merge — historierna är skilda. Det som
flyttades är det `PIXDRIFT_SYNC.md` kallar portabelt, plus en körbar slice mot
PIXDRIFT Identity.

## Vad som finns här

- Domän 1:1: `src/lib/tyra/{case,crm,pricing,tireHealth,tireWarnings,services,truth}.ts`
- Schema `tyra` (eget, inga delade tabeller): kunder, fordon, wheel_sets,
  tire_cases + steg/operationer/händelser, hub-länkar, inspektioner
- UI: `/tyra` lista+skapa, `/tyra/cases/[id]` work card, `/tyra/hub/[token]` gäst
- API: `GET|POST /api/tyra/cases`, `GET /api/tyra/cases/[id]`, `POST /api/tyra/hub/link`
- Events: `tyra.case.created`, `tyra.case.completed`, `tyra.hub.link.issued`
- Session: PIXDRIFT OIDC / `requireOrg`. Inte NextAuth.

## Vad som inte finns (medvetet)

- TYRA-repots NextAuth, `/login`, `/signup`, `organizations`/`users`/`memberships`
- Leverantörsgateway, live-priser, Fortnox
- Cron, reminder-outbox, SMS
- BankID
- Full ops-yta (pick, quotes, hardware, integrations, settings)

De ytorna kommer som senare slices från samma repo, inte som låtsasfunktioner.

## Token

Hub-token hashas med SHA-256. Klartext visas en gång i httpOnly-cookien
`tyra_issued` (120 s), samma mönster som IRMA.
