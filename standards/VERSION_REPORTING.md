# Version reporting standard

Goal: Each product can report:

- product
- version
- environment
- commit SHA
- build time

## `/version`

- **Purpose**: traceability and support diagnostics.
- **Response**: `200`
- **Content type**: `application/json`

Example response:

```json
{
  "product": "ALVA",
  "version": "0.0.0",
  "environment": "local",
  "commitSha": "cbaf3c9",
  "buildTime": "2026-08-22T12:00:00.000Z"
}
```

Notes:

- `version` should come from the product's own versioning (package/app version).
- `commitSha` should reflect the deployed artifact.

