# Products (separate repositories)

This `kansli-platform` repository is a **workspace/control plane**. It must **not** contain copies of product source code.

Clone each product repository into a dedicated folder under `products/` (or attach it via a multi-root workspace) so each product keeps:

- its own Git repo & history
- its own branches/releases
- independent deployment capability

Expected local layout (conceptual):

```text
products/
  alva/    (separate git repo)
  tora/    (separate git repo)
  rita/    (separate git repo)
  irma/    (separate git repo)
  britt/   (separate git repo)
```

