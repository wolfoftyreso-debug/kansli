# IRMA — signering och evidens

## Vad “signera” betyder här

Nivå 1: motparten kryssar i en deklaration, skriver ett namn, servern hashar.

```
signature_hash = SHA-256(agreementId + "\n" + signerName + "\n" + declaration + "\n" + signedAt)
artifact_sha256 = SHA-256(JSON({ id, title, counterparty, clauses, signerName, signedAt, declaration }))
```

Deklarationen sparas inte i klartext. Den är en konstant i koden (`ACKNOWLEDGEMENT_DECLARATION`). Om konstanten ändras slutar gamla artefakter att verifiera — det är avsiktligt synligt.

## Nivåer

| Nivå | Spec | I koden |
| --- | --- | --- |
| 0 | Ingen signatur | Informationsunderlag. POST ack avvisas. |
| 1 | Bekräftelse | Hashad förklaring. Default. |
| 2 | Enkel digital signatur | Inte byggt |
| 3 | SMS/e-post-OTP | Inte byggt |
| 4 | ID-kontroll | Inte byggt |
| 5 | ID + liveness | Inte byggt |

UI säger uttryckligen: inte BankID, inte kvalificerad e-signatur enligt eIDAS.

## Evidence package (det som faktiskt finns)

- avtals-id
- org_ref (inte till gästen)
- titel, motpart, klausuler
- content_sha256
- signer_name, signed_at
- signature_hash, artifact_sha256
- verification_level
- `irma.agreement.signed` med requestId
- token inte längre giltig för ny signering (raden är signed)

Saknas: IP, user-agent som bevis, auth-event, ID-dokument, biometri, tidsstämpel från betrodd TSA, kvalificerat certifikat.

## Immutability

UPDATE till `signed` kräver `status <> 'signed'`. En andra ack returnerar den första raden och publicerar inte igen.

Det finns ingen “ändra avtalet”-väg. Därför finns ingen version 2. En ny sanning kräver en ny rad (manuellt, nytt create).

## Länk

- 32 bytes base64url, bara hashen i DB
- TTL 14 dagar
- revoke sätter `token_revoked_at` och `cancelled`
- signed länk kan fortfarande öppnas som kvitto efter TTL
- utgången osignerad länk öppnas inte

## Missbruk att bevaka

Att visa en ritad canvas och kalla den nivå 2. Att sätta `verification_level` till 4 i UI utan ett flöde **i detta system**. Att koppla BankID, Scrive eller annan e-signleverantör. Allt det är förbjudet.
