# MCP

REST = machine interface. MCP = agent interface. One domain layer.

```
MCP tool  →  application service  →  domain logic
REST route →  application service  →  domain logic
```

- Protocol: `2026-07-28` Streamable HTTP (stateless). Older `initialize` is accepted as compatibility only.
- Package: `@pixdrift/mcp-core` — protocol, registry, risk, rate limit, idempotency, telemetry.
- Binding: `src/app/mcp/route.ts` → `src/lib/mcp/handle.ts`.
- Tools: `src/lib/mcp/tools.ts` — thin adapters over `src/lib/{product}`.
- Identity: `@pixdrift/auth-client` `createAccessTokenVerifier` or `readSession`.
- Authz: `@pixdrift/api-core` `requireActor` / `requireOrg` / `requirePermission`.
- Audit: `kansli.mcp.invoked` / `kansli.mcp.denied` plus the product event the service already publishes.

Not in this repo: NORA, Mova, SAGA. Not built: cluster rate-limit store, OpenTelemetry exporter, Grafana dashboards, approval queue, feature flags. Those gaps are listed in the PR, not hidden.
