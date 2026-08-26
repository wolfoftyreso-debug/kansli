# TYRA i kansli

Port från `wolfoftyreso-debug/TYRA` branch `cursor/tyra-instrument-ui-06e9`
(commit `82373ca`). Inte en git-merge — historierna är skilda. Checklista
från det repots `PIXDRIFT_SYNC.md`.

## Portabelt (synkat)

| Källa | I kansli |
| --- | --- |
| `src/lib/domain/*` | `src/lib/tyra/{case,crm,pricing,tireHealth,tireWarnings,services,truth}.ts` |
| `migrations/*.sql` | `db/migrations/tyra/0001_core.sql` + `0002_sync_kit.sql` (`org_ref`, inga identity-tabeller) |
| UI-kernel | `src/components/tyra/*`, CSS-variabler i `src/app/globals.css` (mappade till PIXDRIFT-tokens) |
| Cron / outbox | `tyra.reminder_*`, `GET /api/tyra/cron/reminders`, Vercel cron 07:00 |
| Supplier types + interface | `src/lib/tyra/suppliers/*` |

## Adapter mot Pixdrift

- DB: `pool.query` mot `tyra.*`, inte TYRA:s `query`/`withTransaction`
- Auth: `requireOrg` / `requireOrgAction`, inte NextAuth
- Tenant: `org_ref` = `session.org.ref`
- Messaging: outbox köas, process sätter `BLOCKED` tills en sändadapter finns
- White-label: påminnelsetext signeras `/ <org.name>`. Kundhubben visar inte "Tyra"

## Vad som inte finns (medvetet)

- NextAuth, `/login`, `/signup`, TYRA `organizations`/`users`
- Live-pris, demo-leverantör, Fortnox
- Faktisk SMS/e-postleverans (46elks/Resend-nyckel räcker inte — adaptern saknas)
- Kvalificerad e-signatur / e-legitimation som inloggning
- Full ops-yta (pick, quotes, hardware, settings)

## Ytor

- `/tyra` lista+skapa
- `/tyra/cases/[id]` work card + hub-länk + köa påminnelse
- `/tyra/hub/[token]` gäst
- `/tyra/integrations` leverantörskonton + outbox
- `GET\|POST /api/tyra/cases`, `GET /api/tyra/cases/[id]`, `POST /api/tyra/hub/link`
- `GET /api/tyra/reminders`, `POST /api/tyra/suppliers/search`, `GET /api/tyra/cron/reminders`

## Events

`tyra.case.created`, `tyra.case.completed`, `tyra.hub.link.issued`,
`tyra.reminder.enqueued`, `tyra.reminder.blocked`.
