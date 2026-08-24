# IRMA — säkerhetsrevision

Omfattning: IRMA-ytor i `kansli`. Inte hela plattformen.

Klassning: Critical / High / Medium / Low. Åtgärdat i den här omgången märks **FIXED**.

## Critical

Inga öppna Critical i den implementerade ytan.

| ID | Fynd | Status |
| --- | --- | --- |
| C1 | Klartext-token i `?link=` efter skapande (browser history, Referer, loggar hos org-användaren) | **FIXED** — httpOnly-cookie `irma_issued`, 120 s, path `/irma` |

Ett system utan filuppladdning, utan SQL-strängkonkatenering och med org-scoped `getAgreement` har en liten attackyta. Det gör inte IRMA produktionsklart som Document OS.

## High

| ID | Fynd | Status |
| --- | --- | --- |
| H1 | Token i URL-path `/irma/l/<token>` hamnar i access-loggar, Referer till tredje part, delade skärmdumpar | Öppen. Inherent för magic links. Mitigeras med TTL 14 dagar, revoke, `noindex`, `Cache-Control: no-store` på API. |
| H2 | In-memory throttle (20/15 min) per instans. På Vercel kan varje isolate ha egen karta. API svarar 404 (samma som ogiltig länk) så lockout inte läcker. | Öppen. Inte en ersättning för edge-rate-limit. |
| H3 | GET öppnar och sätter `viewed`. Prefetch, preview-bots och länkskanners räknas som öppning | Öppen, medvetet. Dokumenterat. Första lyckade UPDATE vinner; dubbel-publish är stoppad. |
| H4 | Token är bearer. Ingen OTP, ingen device bind. Den som har länken är motparten | Öppen. Acceptabelt för L1. Otillåtet att kalla detta L3–L5. |
| H5 | L2–L5, BankID, ID-media saknas. Risken är produktmissbruk (sälja L1 som kvalificerad underskrift) | Mitigeras i UI-copy. Inte en kodbugg. |

## Medium

| ID | Fynd | Status |
| --- | --- | --- |
| M1 | Ingen IRMA-RBAC. Varje org-medlem kan skapa, läsa och återkalla | Öppen. |
| M2 | Throttle-nyckel är första 12 tecken av token | Öppen. Minskar granularitet, inte token-entropi. |
| M3 | Ingen radering/retention. Återkallelse lämnar rad + signer_name | Öppen. |
| M4 | Gäst-GET/POST kräver ingen CSRF-token utöver SameSite på session (gäst har ingen session) | Acceptabelt för token-bärare. Origin-check på server actions i Next. |
| M5 | `ILIKE`-sök. `%` och `_` strippas så användaren inte styr wildcard | **FIXED** i listan. |
| M6 | Concurrent ack kunde publicera `signed` två gånger | **FIXED** — UPDATE … RETURNING, publicera bara vid `rowCount > 0`. |
| M7 | Concurrent viewed kunde publicera två gånger | **FIXED** — samma mönster. |
| M8 | Dubbel revoke publicerade `cancelled` igen | **FIXED**. |
| M9 | IDOR mot `GET /irma/[id]` och API | **FIXED** — `id + org_ref`. Fel org → 404/null. Testat. |
| M10 | Cookie-delete utan path kunde lämna `irma_issued` | **FIXED**. |

## Low

| ID | Fynd | Status |
| --- | --- | --- |
| L1 | Inga filer ⇒ ingen malware-PDF, spoofad content-type, SSRF via fetch-av-dokument | N/A tills Blob finns |
| L2 | Ingen IRMA-AI ⇒ ingen prompt injection via dokumenttext in i en modell | N/A |
| L3 | Klausuler är demo-text, inte juridisk mall | Copy, inte sårbarhet |

## Kontrollerad yta (kort)

| Kontroll | Resultat |
| --- | --- |
| Auth bypass på org-API | `requireOrg` — utan session 401/403 via api-core |
| IDOR | org_ref i SELECT |
| Tenant escape | Inga globala listor |
| SQL injection | Parameteriserad `pg` |
| XSS | React-escaping. Ingen `dangerouslySetInnerHTML` i IRMA |
| Token replay efter revoke/expiry | `loadByToken` returnerar null. Signed rader går fortfarande att läsa (kvitto) |
| Secrets i repo | Inga IRMA-nycklar |

## Vad som inte ska påstås

Hashad bekräftelse är inte kryptografisk icke-förnekelse mot en identifierad person. Den binder ett namn + deklaration + tid till en SHA-256. Den som har länken kan skriva vilket namn som helst.

Se `SIGNATURE_SECURITY.md`.
