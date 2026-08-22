# Data ownership (draft)

This document maps which system **owns** which data models. Ownership must be verified from actual schemas and code before finalizing.

Status: `UNKNOWN / TO BE AUDITED` (product repos not attached in this environment).

## Illustrative ownership map (NOT VERIFIED)

```text
KANSLI IDENTITY
owns:
User
Organization
Membership
Session

ALVA
owns:
DiagnosticCase
DiagnosticEvidence
DiagnosticResult

TORA
owns:
Tender
Qualification
Submission

RITA
owns:
TaxAnalysis
TaxOpportunity
Eligibility

IRMA
owns:
Agreement
Party
Signature
Obligation

BRITT
owns:
ManagementAnalysis
Dashboard
Report
ManagementAutomation
```

## Verification checklist

- Locate schemas (Prisma/SQL/ORM models) per product
- Identify cross-product references and integration boundaries
- Confirm whether any shared identity store exists today (and if so, its interfaces)

