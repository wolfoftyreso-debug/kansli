# IRMA — dokumentpipeline

Det finns **ingen** dokumentpipeline.

Specen kräver separation:

originalfil → extraherad text → strukturerad modell → renderad representation.

IRMA idag:

användarens formulärfält → en Postgres-rad → HTML i gästvyn.

Ingen originalfil att skydda. Ingen OCR. Ingen renderad PDF.

## Vad som *finns* som grovt motsvarar stegen

| Steg | Implementation |
| --- | --- |
| Intake | `createAgreement` — title, counterparty, body, clauses |
| Understand | Ingen. Klausuler är `DEFAULT_CLAUSES` om inget annat skickas. |
| Verify | Org-detaljsidan räknar om content-hash. Inte “IRMA tolkade så här”. |
| Digital flow | Gästsidan: läs → bekräfta → kvitto |
| Output | HTML. API-JSON är databasen, inte ett exportformat. |

## När en pipeline ska införas

Krav som redan är låsta i doktrin, inte i kod:

1. Originalet är immutable. Derived files är egna objekt.
2. Parsing körs isolerat. Dokument är untrusted input.
3. Ingen publik bucket.
4. AI får inte vara enda representationen av affärskritiska fält.
5. Production-facing UI får inte visa en progressbar som låtsas OCR:a.

Utan Vercel Blob (eller motsvarande privat store) ska intake **inte** låtsas ta emot PDF.
