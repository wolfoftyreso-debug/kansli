# Agent context: KANSLI

## What is KANSLI?

KANSLI is the **workspace + technical control plane** for a family of independent professional B2B products.

## Products

- ALVA
- TORA
- RITA
- IRMA
- BRITT

## Core principle

Products are **independent specialist products** with separate repositories, histories, and deployment lifecycles. KANSLI coordinates conventions and shared foundations without absorbing product business logic.

## DO NOT

- Merge repositories automatically
- Rewrite working systems blindly
- Introduce Kubernetes
- Introduce microservices without evidence
- Introduce Kafka
- Share product databases
- Move business logic into platform
- Make undocumented architectural changes
- Deploy production automatically

## ALWAYS

- Inspect first
- Preserve Git history
- Preserve working behavior
- Test changes
- Document architectural decisions
- Keep solutions simple
- Prefer boring technology
- Optimize for maintainability
- Protect tenant isolation
- Protect customer data

See `/docs` and `/architecture` for details.

