# Migration roadmap (draft)

This roadmap is phased to avoid blind rewrites. It becomes actionable only after the product repositories are attached and audited.

## Phase 0 — INVENTORY

- Establish the KANSLI workspace control plane
- Inventory all repositories
- Document current stacks, maturity, and production blockers

## Phase 1 — CLEAN

- Remove blockers and obvious technical debt per product
- Improve local dev ergonomics and reliability

## Phase 2 — STANDARDIZE

- Standardize tooling/conventions where it provides real value (keep migrations small and reversible)

## Phase 3 — SHARED FOUNDATION

- Shared identity foundations
- UI primitives (only after design audit)
- Logging and error conventions

## Phase 4 — DATABASE

- Verified PostgreSQL baselines per product
- Safe migrations and backup/restore practices

## Phase 5 — BACKEND

- Verified API/worker architecture where needed
- Shared contracts (OpenAPI, event schemas) when beneficial

## Phase 6 — STAGING

- AWS staging environments and smoke checks

## Phase 7 — HARDENING

- Security reviews, tests, backups, restore drills, observability

## Phase 8 — PRODUCTION

- Controlled production rollout per product

