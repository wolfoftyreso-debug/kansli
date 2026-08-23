#!/usr/bin/env bash
#
# Bring up the whole Pixdrift environment locally against a real Postgres:
# starts Postgres (owner/app split), wires env (issuer, secrets, DB), and runs
# the kansli app with the co-located IdP under /idp. On first /idp request the
# IdP bootstraps the schema, rotating key, client registry and demo tenant.
#
#   scripts/dev-up.sh            # dev server (next dev) on :3000
#   BUILD=1 scripts/dev-up.sh    # production build (next start) on :3000
#
# Demo login: demo@exempelbolaget.se / demo-losenord-1234
set -euo pipefail
cd "$(dirname "$0")/.."

PGPORT="${PGPORT:-5433}"
PGPORT="$PGPORT" scripts/dev-postgres.sh >/dev/null

export DATABASE_URL="postgres://pixdrift_app:apppw@127.0.0.1:${PGPORT}/pixdrift_idp"
export PIXDRIFT_DB_OWNER_URL="postgres://pixdrift_owner:ownerpw@127.0.0.1:${PGPORT}/pixdrift_idp"
export PIXDRIFT_SEED_DEMO=true
export PIXDRIFT_ISSUER="http://127.0.0.1:3000/idp"
export APP_BASE_URL="http://127.0.0.1:3000"
export COOKIE_SECURE=false
# Dev-only secrets; production sets strong values via env/Secrets.
export SESSION_SECRET="${SESSION_SECRET:-dev-idp-session-secret-min-32-chars-0001}"
export APP_SESSION_SECRET="${APP_SESSION_SECRET:-kansli-dev-app-session-secret-byt-ut-i-drift-0001}"

echo "[dev-up] Postgres on :${PGPORT}; issuer ${PIXDRIFT_ISSUER}"
if [ "${BUILD:-}" = "1" ]; then
  pnpm build
  PORT=3000 pnpm start
else
  PORT=3000 pnpm dev
fi
