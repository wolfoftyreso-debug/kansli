#!/usr/bin/env bash
#
# Custom-format dump of the owner database. Not a backup until restore is
# tested — run scripts/restore-drill.sh after this.
set -euo pipefail

OWNER_URL="${PIXDRIFT_DB_OWNER_URL:-${PIXDRIFT_TEST_OWNER_URL:-}}"
if [[ -z "$OWNER_URL" ]]; then
  echo "backup-postgres: set PIXDRIFT_DB_OWNER_URL or PIXDRIFT_TEST_OWNER_URL" >&2
  exit 1
fi

OUT="${1:-}"
if [[ -z "$OUT" ]]; then
  mkdir -p backups
  OUT="backups/pixdrift-$(date -u +%Y%m%dT%H%M%SZ).dump"
fi

eval "$(python3 - "$OWNER_URL" <<'PY'
import os, sys
from urllib.parse import urlparse, unquote
u = urlparse(sys.argv[1])
print(f"export PGHOST={u.hostname or '127.0.0.1'}")
print(f"export PGPORT={u.port or 5432}")
print(f"export PGUSER={u.username or ''}")
print(f"export PGPASSWORD={unquote(u.password or '')}")
print(f"export PGDATABASE={u.path.lstrip('/')}")
PY
)"

mkdir -p "$(dirname "$OUT")"
pg_dump --format=custom --no-owner --no-acl --file="$OUT"
echo "backup-postgres: wrote $OUT ($(wc -c <"$OUT") bytes)"
