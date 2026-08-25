# Runbook — MCP

## Endpoint down

1. `GET /api/mcp/health`
2. If `database` is `down`, treat as platform DB outage (`/api/platform/health`).
3. If health is up but `/mcp` fails, check `MCP-Protocol-Version` and `Mcp-Method` headers.

## Auth failures spike

Same IdP as the rest of the app. Check `/idp/halsa` and JWKS. Tokens use audience `kansli-web`.

## Tool failures

`GET /api/mcp/metrics` (signed in) shows `by_tool`. A write tool that 503s is usually `DEPENDENCY_UNAVAILABLE` (no DB).

## Client revocation

Revoke the OAuth client in Identity. There is no second MCP client table.

## Rate-limit incident

Limits are per isolate (same class as IRMA throttle). Restarting instances resets the window. This is not a cluster store.

## Security incident

Do not return payloads in logs. Audit events store tool name and status only.
