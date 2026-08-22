# Development (KANSLI workspace)

## Goal

Enable working on **multiple independent product repositories** in a single Cursor/VS Code multi-root workspace, while preserving:

- separate Git histories
- separate branching/release processes
- separate deployments

## Workspace

Open `kansli.code-workspace`.

This repository ("KANSLI — Platform") is the control plane and documentation home. Product repositories should be attached as additional roots.

## Where to put product repos

Preferred local convention:

```text
products/<product>/
```

Examples:

```text
products/alva/
products/tora/
products/rita/
products/irma/
products/britt/
```

Important:

- This repo intentionally ignores `products/*` to prevent accidental committing of product code.
- Each product directory should be its **own Git repository**.

## Current status in this environment

See `docs/REPOSITORY_INVENTORY.md`.

