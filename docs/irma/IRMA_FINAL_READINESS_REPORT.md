# IRMA FINAL READINESS REPORT

Datum: 2026-08-24. Underlag: kod i `kansli` på grenen med token-lifecycle, inte master-specens önskelista.

## Betyg

Siffrorna är mot **Document & Agreement Operating System** i master-specen, inte mot “finns det en knapp”. 100 = specen är uppfylld och verifierad.

| Yta | Score | Motivering |
| --- | --- | --- |
| Overall readiness | **28** | En smal, ärlig handshake. Inte capture/understand/track/analyze. |
| Security | **64** | Tenant + hashad token + revoke/TTL + inga Critical i ytan. Kvar: bearer i URL-loggar, in-memory throttle, GET=viewed. |
| UX | **56** | Lugnt, svensk copy, empty states, gäststeg 1–3. Ingen Home “vad måste jag göra”, ingen clutter-dashboard heller. |
| Mobile | **58** | Gästflödet är byggt för telefon. Org-sidan är enkel, inte native-känsla. Ingen iOS/Android-matris. |
| Document integrity | **46** | SHA-256 på textinnehåll och artefakt. Inga filer, inga versioner, ingen PDF-hash. |
| Signing | **24** | L0/L1 bara. Evidens är namn + hash. Inte identifierad person. |
| AI reliability | **0** | Ingen IRMA-AI. Korrekt nolla, inte “gateway finns någon annanstans”. |
| Lifecycle management | **20** | Status + 14-dagars länk. Ingen expiry/notice/renewal-motor. |
| Test coverage | **61** för handshake, **12** mot specens A–E | Live Postgres täcker create/open/ack/revoke/IDOR/expiry/L0. A–E går inte att köra. |

Ett system med Critical säkerhetshål får inte kallas produktionsklart. Handshake-ytan har inga öppna Critical efter den här omgången. **Produkten IRMA enligt specen är ändå inte produktionsklar.**

## Kvarvarande ärenden

### Critical

Inga i implementerad yta.

### High

- Token i `/irma/l/...` syns i access-loggar och Referer (H1).
- Throttle är process-lokal (H2).
- GET räknas som öppning (H3).
- Bearer-länk utan OTP (H4) — acceptabelt bara så länge UI säger nivå 1.
- Risk att L1 säljs som e-signatur (H5) — copy, inte kod.

### Medium

- Ingen IRMA-RBAC (M1).
- Ingen retention/radering (M3).
- Ingen e-postkvittens, ingen export, ingen edge-rate-limit.

## Vad som förbättrades i den här omgången

- Token lämnar inte org-UI via query-string.
- 14 dagars TTL, återkallelse, expired/cancelled i status.
- content_sha256 + ominräkning på org-detalj.
- Nivå 0 vs 1.
- Sök på titel/motpart utan wildcard-injection.
- Idempotent viewed/signed/cancelled.
- Org-scoped detalj-API.
- Gäst-API `no-store`; nivå 0 kan inte “signeras” via POST.
- Tester och de här dokumenten.

## Rekommenderade nästa steg (i ordning)

1. Låt copy och sälj vara lika smala: “underlag + bekräftelse”, inte “IRMA signerar avtal”.
2. Edge-rate-limit på `/irma/l/*` och `/api/irma/l/*` i denna app.
3. När det finns affärsbehov: filer och PDF i detta system, OTP via 46elks/Resend om de redan är vendorer. Ingen ny e-signleverantör.
4. Bygg inte Ask IRMA eller market intel förrän det finns strukturerad data här. Inga externa research-API:er.

## North star vs nuläge

Specen: IRMA ska veta var avtalet ligger, vem som skrev på, när det går ut, vad det kostar, och kunna visa varför.

Nuläge: IRMA vet att en org skapade en textrad, att någon med länken öppnade den, och (om nivå 1) att någon skrev ett namn. Den kan visa hashen. Den vet inte om namnet är personen. Den har inget original. Den har inget slutdatum.

Det är avståndet.
