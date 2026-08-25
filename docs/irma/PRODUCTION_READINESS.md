# IRMA — produktionsberedskap

IRMA kan driftsättas **som handshake-modul** i samma Vercel-projekt som navet. Den kan inte driftsättas som Document OS.

## Krav som är på plats

- Versionerade migreringar, idempotenta `IF NOT EXISTS` / drop+add check.
- App-rollen via `DATABASE_URL`. Owner bara för migrate.
- Org-API bakom session. Gäst-API bakom token-hash.
- Events append-only i `platform.events`.
- Inga IRMA-hemligheter i git.
- CI: lint, typecheck, test, build (navets workflow).
- Explicit copy att det inte är BankID / kvalificerad e-signatur.

## Krav som saknas för “Document OS i produktion”

| Område | Läge |
| --- | --- |
| Backup / PITR | Beror på Neon-projektet. Ingen dokumenterad IRMA-restore. |
| Monitoring / alert på failed ack | Bara request-id och events. Inga IRMA-alerts. |
| Rate limit vid edge | In-memory, per instans. |
| E-post/SMS med scoped token | Ingen utskickskanal. Org kopierar URL. |
| Filstorage | Ingen. |
| Retention / radera / legal hold | Ingen. |
| Staging vs prod KYC | Irrelevant — ingen KYC. |
| Webhooks | Inga. |
| Load / OCR-mätning | Inget att mäta. |

## Miljöer

Samma uppdelning som navet: development, test, (eventuell) staging, production. IRMA läser inga sandbox-KYC-nycklar. Lägg inte till sådana i production-env “för framtiden”.

## Go / no-go

| Påstående | Dom |
| --- | --- |
| Kan vi släppa L1-bekräftelse till en intern pilot? | Ja, med copy och TTL. |
| Kan vi sälja IRMA som avtalsregister? | Nej. |
| Kan vi sälja IRMA som e-signatur? | Nej. |
| Finns Critical öppna i handshake-ytan? | Nej efter token-cookie och race-fixar. |
| Är produkten produktionsduglig enligt master-specen? | Nej. |

Nästa verkliga steg är inte fler audit-filer. Det är antingen (a) lämna
handshake som den är, eller (b) bygga PDF/fil/OTP **i detta repo** mot Postgres
och befintliga vendorer. Inte BankID. Inte extern e-sign. Inte Mobbin.
