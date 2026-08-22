# ADR-004: Separate product repositories

STATUS: ACCEPTED

## CONTEXT

KANSLI coordinates a family of products with different domains, maturity, and release cadences. Preserving autonomy reduces coupling and limits blast radius.

## DECISION

Maintain **separate Git repositories** per product. KANSLI provides a **workspace/control plane** and shared standards, but does not absorb product source code.

## WHY

- Preserves independent histories and release processes
- Enables independent deployments and operational ownership
- Avoids monorepo coupling while still enabling cross-repo search and analysis via multi-root workspace

## CONSEQUENCES

- Shared packages/services must be versioned and adopted incrementally
- Multi-repo tooling (scripts/status, documentation) becomes important

## REVERSIBILITY

High (structurally). A monorepo can be adopted later if evidence supports it, but should be a deliberate migration with clear benefits.

