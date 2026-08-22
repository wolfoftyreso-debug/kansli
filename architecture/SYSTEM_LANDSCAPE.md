# System landscape (logical)

This is a **logical** picture of the intended platform/product family. It does **not** imply centralized implementation today.

```text
                    KANSLI
                       │
        ┌──────────────┼──────────────┐
        │              │              │
     Shared         Shared         Shared
     Identity       UI             Infrastructure
        │
 ┌──────┼──────┬──────┬──────┬──────┐
 │      │      │      │      │      │
ALVA   TORA   RITA   IRMA   BRITT  (future products)
```

## Notes

- **Products remain independent**: separate repos, separate deployments, separate data models.
- Shared capabilities should be **few, robust, and well-versioned**.

