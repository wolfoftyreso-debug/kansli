# ADR-002: PostgreSQL as primary database

STATUS: ACCEPTED (draft)

## CONTEXT

The platform targets professional B2B systems that benefit from transactional consistency, strong relational modeling, and mature operational tooling.

## DECISION

Use **PostgreSQL** as the primary database technology across the product family where a database is required.

## WHY

- Strong relational capabilities and constraints
- Mature ecosystem and operational practices
- Good fit for multi-tenant patterns

## CONSEQUENCES

- Products using other datastores must be evaluated using the deviation policy in `architecture/TARGET_ARCHITECTURE.md`
- Standardize backup/restore and migration practices over time

## REVERSIBILITY

Medium. Migrations are possible but costly; keep deviations explicit and justified.

