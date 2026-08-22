# Deployment model (draft)

Principle: **No product should depend on all others**. Each product must remain deployable independently.

Status: `UNKNOWN / TO BE AUDITED` (product repos not attached in this environment).

## Desired properties

- Independent deploy pipelines per product
- Shared conventions (health endpoints, version reporting, logging) without forced coupling
- Minimal shared services; strong blast-radius control

## Shared standards (contracts, not implementations)

- `/health` contract
- `/ready` contract (optional)
- `/version` contract

See `standards/` for future standard definitions.

