#!/usr/bin/env bash
#
# Constitution art. 3: backup is not backup until restore is tested.
# Dump the owner database, restore into a throwaway database, verify schemas,
# drop the throwaway database. Never writes back to the source database.
set -euo pipefail

OWNER_URL="${PIXDRIFT_DB_OWNER_URL:-${PIXDRIFT_TEST_OWNER_URL:-}}"
SUPER_URL="${PIXDRIFT_SUPERUSER_URL:-}"
if [[ -z "$OWNER_URL" ]]; then
  echo "restore-drill: set PIXDRIFT_DB_OWNER_URL or PIXDRIFT_TEST_OWNER_URL" >&2
  exit 1
fi

eval "$(python3 - "$OWNER_URL" <<'PY'
import sys
from urllib.parse import urlparse, unquote
u = urlparse(sys.argv[1])
print(f"export SRC_HOST={u.hostname or '127.0.0.1'}")
print(f"export SRC_PORT={u.port or 5432}")
print(f"export SRC_USER={u.username or ''}")
print(f"export SRC_PASSWORD={unquote(u.password or '')}")
print(f"export SRC_DB={u.path.lstrip('/')}")
PY
)"

if [[ -n "$SUPER_URL" ]]; then
  eval "$(python3 - "$SUPER_URL" <<'PY'
import sys
from urllib.parse import urlparse, unquote
u = urlparse(sys.argv[1])
print(f"export SUPER_HOST={u.hostname or '127.0.0.1'}")
print(f"export SUPER_PORT={u.port or 5432}")
print(f"export SUPER_USER={u.username or 'postgres'}")
print(f"export SUPER_PASSWORD={unquote(u.password or '')}")
print("export SUPER_DB=postgres")
PY
)"
else
  SUPER_HOST="$SRC_HOST"
  SUPER_PORT="$SRC_PORT"
  SUPER_USER="$SRC_USER"
  SUPER_PASSWORD="$SRC_PASSWORD"
  SUPER_DB=postgres
fi

DRILL_DB="pixdrift_restore_drill_$$"
DUMP="$(mktemp /tmp/pixdrift-restore-drill.XXXXXX.dump)"
cleanup() {
  PGPASSWORD="$SUPER_PASSWORD" psql \
    -h "$SUPER_HOST" -p "$SUPER_PORT" -U "$SUPER_USER" -d "$SUPER_DB" \
    -v ON_ERROR_STOP=1 \
    -c "drop database if exists ${DRILL_DB};" >/dev/null 2>&1 || true
  rm -f "$DUMP"
}
trap cleanup EXIT

echo "restore-drill: dumping ${SRC_DB}"
PGPASSWORD="$SRC_PASSWORD" pg_dump \
  --format=custom --no-owner --no-acl \
  -h "$SRC_HOST" -p "$SRC_PORT" -U "$SRC_USER" \
  --file="$DUMP" "$SRC_DB"

echo "restore-drill: creating ${DRILL_DB}"
PGPASSWORD="$SUPER_PASSWORD" psql \
  -h "$SUPER_HOST" -p "$SUPER_PORT" -U "$SUPER_USER" -d "$SUPER_DB" \
  -v ON_ERROR_STOP=1 \
  -c "drop database if exists ${DRILL_DB};" \
  -c "create database ${DRILL_DB} owner ${SRC_USER};"

echo "restore-drill: restoring"
PGPASSWORD="$SRC_PASSWORD" pg_restore \
  --no-owner --no-acl \
  -h "$SRC_HOST" -p "$SRC_PORT" -U "$SRC_USER" \
  -d "$DRILL_DB" "$DUMP"

echo "restore-drill: verifying"
PGPASSWORD="$SRC_PASSWORD" psql \
  -h "$SRC_HOST" -p "$SRC_PORT" -U "$SRC_USER" -d "$DRILL_DB" \
  -v ON_ERROR_STOP=1 <<'SQL'
select 1;
select count(*) as product_schemas
  from information_schema.schemata
 where schema_name in ('platform','kansli','tora','rita','britt','irma','tyra','alva');
select to_regclass('platform.events') as events_table;
SQL

echo "RESTORE DRILL PASSED"
