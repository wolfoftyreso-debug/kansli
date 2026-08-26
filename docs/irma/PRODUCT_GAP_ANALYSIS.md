# IRMA — gap mot master-specen

Klassning: **IMPLEMENTED** / **PARTIAL** / **MOCK** / **MISSING** / **BROKEN** / **NEEDS VERIFICATION**.

Bedömningen gäller koden i `kansli` efter token-lifecycle, återkallelse och integritetskoll. Den gäller inte visionen.

Ingen production-facing yta låtsas vara OCR, kvalificerad e-signatur, PDF-studio eller avtalsintelligens.

| # | Förmåga | Status | Vad som faktiskt finns |
| --- | --- | --- | --- |
| 1–4 | Produktvision, guidat flöde, mobile first, ChatGPT-UI | PARTIAL | Gästsidan är ett 3-stegs läs/bekräfta-flöde med stora fält. Org-UI är lista + formulär. Inte ett adaptivt 8-stegs onboardingflöde. |
| 5 | Document intake | MISSING | Ingen foto, PDF, Word, kamera, Blob. Bara titel, motpart, fritext. |
| 6 | Document understanding | MISSING | Ingen strukturerad dokumentmodell. Klausuler är en fast demo-lista. |
| 7 | Human verification | MISSING | Ingen extraktion att verifiera. |
| 8 | Document builder | MISSING | Skapa = formulär, inte “skapa ett konsultavtal”. |
| 9 | Template engine | MOCK | `DEFAULT_CLAUSES` är tre hårdkodade stycken, märkta som demo. Inte ett mallbibliotek. |
| 10 | Signering som modul (L0–L5) | PARTIAL | L0 informationsunderlag och L1 hashad bekräftelse. L2–L5 finns inte. |
| 11 | Signature evidence package | PARTIAL | signerName, signedAt, signature_hash, artifact_sha256, content_sha256, requestId i event. Ingen IP, enhet, ID-handling, liveness. |
| 12 | Immutability / versioner | PARTIAL | Signed rad skrivs inte om (UPDATE kräver `status <> 'signed'`). Ingen version 2. |
| 13 | Audit log | PARTIAL | `platform.events` för created/viewed/signed/cancelled. Inte fältändringar, export, arkiv. |
| 14 | Output engine (JSON/text/HTML/PDF) | MISSING | JSON via API är raden, inte en renderad handling. Ingen PDF. |
| 15–16 | PDF Design Studio / security design | MISSING | |
| 17 | QR-verifiering | MISSING | |
| 18 | Flerspråk | MISSING | UI på svenska. Ingen language-representation. |
| 19–21 | Avtalsregister, tidslinje, renewal | MISSING | Lista + status. Inga datumregler. |
| 22 | Reminders | MISSING | |
| 23–27 | Intelligence, jämförelse, market, negotiation | MISSING | Ingen IRMA-AI. |
| 28–31 | Business relevance, ISO, kollektivavtal, legal knowledge | MISSING | |
| 32–37 | AI-gateway, router, agenter, high-risk, fact/inference, traceability | MISSING | IRMA anropar ingen modell. |
| 38 | Datamodell (specens 30+ objekt) | PARTIAL | Ett objekt: Agreement + inbäddade clauses. Mapping i `DATA_MODEL.md`. |
| 39 | Multitenancy | IMPLEMENTED | `org_ref` på varje rad. `getAgreement` kräver org. Gästläsning via token-hash. |
| 40 | RBAC | PARTIAL | Org-medlemskap. Inga IRMA-roller. |
| 41 | External participants / guest | IMPLEMENTED | Magic link utan konto. |
| 42–44 | Security review, pipeline, prompt injection | PARTIAL | Se `SECURITY_AUDIT.md`. Ingen filpipeline, därför ingen PDF-isolation. |
| 45 | Privacy | PARTIAL | Minimal data (namn + text). Ingen ID-media. Retention är inte konfigurerbar. |
| 46 | Cryptographic integrity | PARTIAL | SHA-256 på innehåll och artefakt. Inte Merkle, inte kvalificerat sigill. |
| 47 | Storage | MISSING | Ingen object store. Rader i Postgres. |
| 48 | Backup / DR | NEEDS VERIFICATION | Plattformens Neon/Postgres. Ingen IRMA-specifik restore-övning. |
| 49 | Delete / retention / legal hold | MISSING | Ingen radering, ingen hold. Återkallelse tar inte bort raden. |
| 50 | Search | PARTIAL | Titel/motpart `ILIKE`. Inget “avtal som går ut i december”. |
| 51–54 | IRMA Home, Ask IRMA, command+UI, contextual AI | PARTIAL | Home är listan. Ingen chat. UI är deterministiskt — det är rätt. |
| 55 | Notifications | PARTIAL | BRITT-observationer. Ingen e-post/SMS/push. |
| 56 | Accessibility | PARTIAL | Semantiska fält, stora klickytor på gästsidan. Ingen WCAG-svit. |
| 57 | Performance | NEEDS VERIFICATION | Inga mätningar. Flödet är en rad i Postgres. |
| 58–59 | Empty/loading/error language | PARTIAL | Empty states och svenska fel. Ingen offline-yta. |
| 60–63 | Visual QA, E2E-scenarier A–E, browser matrix | PARTIAL | Handshake-tester + live Postgres. A–E från specen är inte körbara. |
| 64 | Mock audit | PARTIAL | Demo-klausuler är märkta. Ingen fake signering. |
| 65–67 | Dead code, deps, consistency | PARTIAL | Tunn modul, en auth-väg, en API-client. |
| 68–70 | Observability, AI obs, cost | PARTIAL | `x-request-id`, events. Ingen IRMA-AI-kostnad. |
| 71 | Human approval | PARTIAL | Skapa och bekräfta är explicita klick. Inga AI-actions att godkänna. |
| 72 | System states | PARTIAL | draft/viewed/signed/expired/cancelled. Inte sent/archived/superseded. |
| 73–75 | Workflow, approvals vs signature, delegation | MISSING | |
| 76–77 | Org onboarding, branding | MISSING | |
| 78–80 | Bulk import, duplicates, relationships | MISSING | |
| 81–85 | Expiry vs termination, obligations, finance, pricing, date engine | MISSING | |
| 86 | Email/SMS links | PARTIAL | Token + TTL + revoke. Ingen OTP. Länken är bearer. |
| 87 | Receipts | PARTIAL | Gästsidan visar “Bekräftat av …”. Ingen e-postkvittens. |
| 88 | Export | MISSING | |
| 89 | API-first | PARTIAL | create/list/get/revoke/open/ack finns på servern. Inte send/PDF/search-semantic. |
| 90–91 | Webhooks, integrationsgräns | MISSING | Events internt. Inga signerade webhooks. |
| 92–94 | Jobs, idempotency, concurrency | PARTIAL | Ack och viewed publicerar bara när UPDATE träffar. Ingen optimistic lock för org-redigering (ingen redigering). |
| 95–98 | Migrations, env, secrets, CI | PARTIAL | Versionerade SQL-migreringar. CI i navet. Inga IRMA-hemligheter i git. |
| 99–107 | Definition of done / North star | MISSING som produkt | Handshake-modulen kan vara “klar” för sin smala uppgift. Document OS är det inte. |

## Sammanfattning

- **IMPLEMENTED (smalt):** gästlänk, L0/L1, org-isolering, återkallelse, TTL, innehålls-/artefakthash, sök på titel/motpart.
- **MOCK:** klausulmallarna.
- **MISSING:** i princip hela dokumentmotorn, AI, lifecycle, PDF, signering L2–L5.
- **BROKEN:** inget känt i det implementerade flödet efter token-cookie, revoke-idempotens och signed-race.

Att bygga specens resten i det här varvet skulle vara feature theater. Det är medvetet inte gjort.
