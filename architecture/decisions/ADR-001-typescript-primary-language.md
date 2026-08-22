# ADR-001: TypeScript as primary language

STATUS: ACCEPTED (draft)

## CONTEXT

The product family targets modern web development with shared conventions and shared packages over time.

## DECISION

Use **TypeScript** as the primary language for KANSLI and (where feasible) products.

## WHY

- Strong tooling and IDE support
- Ecosystem fit for Next.js/Node runtimes
- Improves maintainability for large codebases

## CONSEQUENCES

- Establish shared TS configuration conventions (`standards/`)
- Products written in other languages remain independent; migration is case-by-case

## REVERSIBILITY

Medium. Multi-language is possible, but shared package strategy becomes more complex.

