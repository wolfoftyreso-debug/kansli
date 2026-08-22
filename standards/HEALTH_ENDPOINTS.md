# Health endpoint standard

Goal: Standardize **contracts** across products without enforcing identical implementations.

## `/health`

- **Purpose**: lightweight liveness/health check suitable for load balancers and basic monitoring.
- **Response**: `200` if healthy; `>=500` if unhealthy.
- **Content type**: `application/json`

Example response:

```json
{
  "status": "ok",
  "service": "ALVA",
  "timestamp": "2026-08-22T12:00:00.000Z"
}
```

## `/ready` (optional)

- **Purpose**: readiness for serving traffic (e.g. DB connection available, migrations applied).
- **Response**: `200` if ready; `>=500` if not ready.

Example response:

```json
{
  "status": "ok",
  "service": "ALVA",
  "checks": {
    "db": "ok",
    "worker": "ok"
  }
}
```

