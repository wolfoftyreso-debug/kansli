# IRMA — datamodell

## Mapping mot specens objekt

Specen listar ~30 domänobjekt. IRMA har **ett** persisterat objekt plus inbäddade klausuler och plattformens gemensamma identitet.

| Spec | I den här koden | Kommentar |
| --- | --- | --- |
| Organization / Workspace / User / Role | `public` identity + session.org | Inte IRMA-tabeller. Inga IRMA-roller. |
| Contact / Counterparty | `agreements.counterparty` (text) | Inte en kontaktentitet. |
| Document / DocumentVersion | — | Finns inte. |
| DocumentTemplate / DocumentField / Clause | `clauses` jsonb + `DEFAULT_CLAUSES` | Inte versionerade mallar. |
| Obligation | — | |
| Agreement / AgreementVersion | `irma.agreements` | Ingen versionskedja. |
| SignatureRequest / Signatory | Token + `signer_name` | En motpart, ett namn. |
| VerificationEvent / IdentityVerification | `verification_level` 0\|1 | Inget ID-underlag. |
| AuditEvent | `platform.events` | Append-only, org-scoped. |
| Reminder / Workflow / WorkflowStep | — | |
| Attachment / Export / Translation | — | |
| KnowledgeSource / AIAnalysis / Recommendation | — | |
| Notification | BRITT observation från event | Inte en IRMA-tabell. |
| BrandProfile | — | |

Bygg inte de saknade tabellerna “för att specen räknar upp dem”. Lägg till när ett flöde behöver dem.

## `irma.agreements`

| Kolumn | Innebörd |
| --- | --- |
| `id` | UUID-text, primärnyckel |
| `org_ref` | Tenant. Alla org-läsningar filtrerar här. |
| `title`, `counterparty`, `body` | Det motparten ser |
| `clauses` | jsonb-lista `{id, heading, text}` |
| `status` | draft \| viewed \| signed \| expired \| cancelled |
| `token_hash` | SHA-256 av magic token. Unikt index. |
| `token_expires_at` | default created_at + 14 dagar |
| `token_revoked_at` | satt vid återkallelse |
| `viewed_at` | första öppning |
| `verification_level` | 0 eller 1 |
| `content_sha256` | hash av title+counterparty+body+clauses vid skapande |
| `signed_at`, `signer_name` | L1 |
| `signature_hash` | hash(agreementId, name, declaration, signedAt) |
| `artifact_sha256` | hash av kanonisk JSON inkl. klausuler |
| `created_at` | |

App-rollen ska inte kunna `UPDATE` en signed rad till ny text. Det skyddas i domänkoden (`status <> 'signed'`), inte av en DB-trigger. Det är en känd begränsning.

## Integritet

`verifyAgreementIntegrity` räknar om `content_sha256` och, om signed, `artifact_sha256` mot `ACKNOWLEDGEMENT_DECLARATION`. Äldre rader utan content-hash ger `contentMatches: null`.

## Events

Ämne: `irma:agreement:<id>`. Payload bär titel, ibland signerName och artifactSha256 — inte token, inte declaration.
