# ADR-003: Modular monolith as default

STATUS: ACCEPTED (draft)

## CONTEXT

Premature microservices introduce operational complexity and increase cross-team coordination costs. The product family must remain maintainable and robust with limited shared blast radius.

## DECISION

Default to a **modular monolith** approach within each product, using well-defined internal modules and contracts.

## WHY

- Lower operational overhead than microservices
- Clearer local reasoning about behavior and data
- Easier testing and deployments

## CONSEQUENCES

- Define module boundaries and contracts within each product
- Introduce shared services only with strong evidence and robust operational ownership

## REVERSIBILITY

High. Modules can be extracted later when justified by clear scaling/ownership needs.

