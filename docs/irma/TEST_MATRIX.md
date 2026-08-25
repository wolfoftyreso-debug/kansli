# IRMA — testmatris

## Vad som körs i CI

| Svit | Typ | Krav |
| --- | --- | --- |
| `src/lib/irma/agreements.test.ts` | Live Postgres | `PIXDRIFT_TEST_DATABASE_URL` + owner URL |
| `src/lib/irma/status.test.ts` | Enhet | — |
| `src/lib/irma/integrity.test.ts` | Enhet | — |
| `src/lib/irma/throttle.test.ts` | Enhet | — |
| Family/catalog alignment | Enhet | Event-kind `irma.agreement.cancelled` måste finnas |

Live-sviten hoppas över om testdatabasen saknas. Den hoppar inte över fel.

## Handshake (implementerad)

| Steg | Automatiserat | Manuellt |
| --- | --- | --- |
| Skapa, bara hash i DB | ja | ja |
| Fel token → null / 404 | ja | ja |
| Första open → viewed, en event | ja | ja |
| Ack → signed, hash, ingen declaration i DB | ja | ja |
| Andra ack ändrar inte namn, ingen andra signed-event | ja | ja |
| Integritet stämmer efter signering | ja | ja (org-detalj) |
| Nivå 0 signeras inte | ja | ja |
| IDOR: fel org → null | ja | — |
| Sök strippar `%` | ja | ja |
| Utgången token öppnas inte, org ser expired | ja | — |
| Revoke → cancelled, token död, idempotent event | ja | ja |
| Token inte i `?link=` | — | ja (cookie + `?issued=1`) |

## Specens scenarier A–E

| Scenario | Status |
| --- | --- |
| A leverantörsavtal (PDF → extract → reminder → AI) | Inte körbart. Ingen PDF, extract, reminder, AI. |
| B mall → mottagare → mobil → PDF → evidence → lock | Delvis: mall är demo-klausuler, mottagare är länk, evidence är hash, lock är signed-rad. Ingen PDF. |
| C hög säkerhet (ID + liveness) | Inte körbart. |
| D flerspråk | Inte körbart. |
| E amendment av signerat avtal | Inte körbart. Signed raden kan inte bli version 2. |

## Browser

Målet för manuell QA i den här omgången: Chrome desktop + en smal viewport för gästflödet. Safari/iOS/Android-matrisen är inte körd i den här miljön.

## Säkerhetstester som saknas som automatik

- Throttle mot HTTP (bara enhet på kartan)
- Cookie-flaggor i en riktig browser (manuellt)
- Access-log-läckage av token (infrastruktur, inte repo)
