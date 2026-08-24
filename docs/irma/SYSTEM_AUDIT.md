# IRMA — systemkarta

IRMA i det här repot är en **överlämningsmodul**, inte ett Document & Agreement Operating System.

Produktvisionen i master-specen beskriver capture → understand → structure → sign → track → analyze. Det som finns är: skapa ett textunderlag, skicka en tidsbegränsad länk, låta motparten läsa och (valfritt) lämna en hashad bekräftelse.

## Var IRMA sitter

```
Browser
  ├─ /irma                 org: skapa, lista, sök
  ├─ /irma/[id]            org: detalj, integritet, återkalla
  ├─ /irma/l/[token]       gäst: läs / bekräfta (inget konto)
  ├─ /api/irma/agreements
  ├─ /api/irma/agreements/[id]
  └─ /api/irma/l/[token]
        │
        ▼
Next.js (samma process som kansli, TORA, RITA, BRITT, ALVA)
        │
        ▼
PostgreSQL 16
  irma.agreements          enda IRMA-tabellen
  platform.events          created | viewed | signed | cancelled
        │
        ▼
BRITT observationsinbox    lyssnar, skriver inte i irma.*
```

Ingen separat IRMA-tjänst. Ingen object store. Ingen OCR-worker. Ingen AI-route för IRMA. Ingen webhook-utgång.

## Appar och ytor

| Yta | Filer | Auth |
| --- | --- | --- |
| Org-UI | `src/app/irma/page.tsx`, `src/app/irma/[id]/page.tsx`, `src/app/irma/actions.ts` | OIDC-session, aktiv org |
| Gäst-UI | `src/app/irma/l/[token]/page.tsx`, `…/actions.ts` | Klartext-token i URL:en |
| Org-API | `src/app/api/irma/agreements/route.ts`, `…/[id]/route.ts` | `requireOrg` |
| Gäst-API | `src/app/api/irma/l/[token]/route.ts` | Token-hash, ingen session |
| Domän | `src/lib/irma/{agreements,clauses,status,integrity,throttle,issued-link}.ts` | — |
| Schema | `db/migrations/irma/0001_agreements.sql`, `0002_acknowledge.sql`, `0003_token_lifecycle.sql` | owner-migrering |

## Databas

En tabell: `irma.agreements`.

Kolumner som faktiskt används: `id`, `org_ref`, `title`, `counterparty`, `status`, `token_hash`, `body`, `clauses`, `signed_at`, `signer_name`, `signature_hash`, `artifact_sha256`, `content_sha256`, `verification_level` (0\|1), `token_expires_at`, `token_revoked_at`, `viewed_at`, `created_at`.

Token lagras bara som SHA-256. Klartext visas en gång via httpOnly-cookie `irma_issued` (120 s, path `/irma`).

## Jobs, storage, AI, integrationer

| Del | Status |
| --- | --- |
| Bakgrundsjobb | Inga. Allt synkront i requesten. |
| Filstorage | Ingen. Inga originalfiler. |
| AI | Ingen IRMA-task. Plattformens gateway används inte här. |
| Auth | Samma BFF-cookie som resten av navet. Gästflödet är token. |
| RBAC | Org-medlemskap. Inga IRMA-roller (Legal/Finance/Auditor). |
| Sök | `ILIKE` på titel och motpart. Ingen fulltext, ingen semantik. |
| Sync | Publicerar till `platform.events`. BRITT skapar observationer. |

## Statusmaskin som finns

`draft` → `viewed` → `signed`

Sidospår: `cancelled` (återkallad länk), `expired` (TTL passerad; kan vara härledd i läsning).

`signed` är slut. Ingen ny version, ingen amendment, ingen arkivering.

## Vad som medvetet inte finns

Document intake, structured document model, human verification av extraktion, template engine, PDF/HTML/JSON-outputmotor, PDF Design Studio, QR-verifiering, multilingual engine, avtalsregister/tidslinje/renewal/reminders, portfolio intelligence, jämförelse, förhandling, Ask IRMA, webhooks, bulkimport, branding, L2–L5-signering, Blob, BankID.

De sakerna ska inte låtsas finnas. Se `PRODUCT_GAP_ANALYSIS.md`.
