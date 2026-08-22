# Identity architecture (draft)

Status: `UNKNOWN / TO BE AUDITED` (product repos not attached in this environment).

## Goals

- Support B2B multi-tenant operation (organizations, memberships, roles/permissions)
- Minimize shared blast radius (products must remain deployable independently)
- Standardize authentication conventions across products

## Candidate shared concepts (KANSLI-owned)

```text
User
Organization
Membership
Session
```

## Open questions (to be answered from product repos)

- Which auth provider(s) exist today?
- Do products share tenant identifiers and RBAC models?
- How are sessions and API authentication handled?

