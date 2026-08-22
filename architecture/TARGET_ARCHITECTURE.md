# Target architecture (KANSLI)

This document describes the **intended** target stack and architecture principles. It is not a mandate to rewrite working systems.

## Target stack (starting point)

```text
Language:
TypeScript

Runtime:
Node.js LTS

Frontend:
Next.js + React

Backend:
Fastify

Database:
PostgreSQL

ORM:
Prisma

Validation:
Zod

API:
REST + OpenAPI

Testing:
Vitest + Playwright

Packages:
pnpm

Containers:
Docker

CI/CD:
GitHub Actions

Infrastructure:
Terraform

Cloud:
AWS

Compute:
ECS Fargate

Database hosting:
RDS PostgreSQL

Object storage:
S3

Queues:
SQS

Scheduling:
EventBridge

Secrets:
Secrets Manager

Observability:
CloudWatch + Sentry
```

## Deviation policy

For each product and each deviation from the target stack, choose one:

- **KEEP**
- **MIGRATE NOW**
- **MIGRATE LATER**
- **DO NOT MIGRATE**

Status: `UNKNOWN / TO BE AUDITED` until product repos are attached and assessed (see `docs/CROSS_REPO_TECHNICAL_AUDIT.md`).

