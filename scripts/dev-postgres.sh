#!/usr/bin/env bash
#
# Bring up a local PostgreSQL for the Pixdrift IdP (owner/app split), idempotently.
# Dev/CI only — ephemeral data dir, trivial passwords. Prints connection strings.
#
#   scripts/dev-postgres.sh            # init (if needed) + start + roles + dbs
#   scripts/dev-postgres.sh stop       # stop the cluster
#
# Roles:  pixdrift_owner (schema/migrations), pixdrift_app (runtime, owns nothing)
# DBs:    pixdrift_idp (runtime), pixdrift_idp_test (integration tests)
set -euo pipefail

PGVER="${PGVER:-16}"
PGBIN="/usr/lib/postgresql/${PGVER}/bin"
PGDATA="${PGDATA:-/tmp/pixdrift-pgdata}"
PGPORT="${PGPORT:-5432}"
PGHOST="127.0.0.1"
OWNER_PW="${OWNER_PW:-ownerpw}"
APP_PW="${APP_PW:-apppw}"

log() { echo "[dev-postgres] $*"; }

stop() {
  if [ -d "$PGDATA" ]; then "$PGBIN/pg_ctl" -D "$PGDATA" stop -m fast || true; fi
}

if [ "${1:-}" = "stop" ]; then stop; exit 0; fi

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  log "initdb -> $PGDATA"
  "$PGBIN/initdb" -D "$PGDATA" -U postgres --auth-local=trust --auth-host=md5 >/tmp/pixdrift-initdb.log 2>&1
fi

if ! "$PGBIN/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1; then
  log "starting on ${PGHOST}:${PGPORT}"
  "$PGBIN/pg_ctl" -D "$PGDATA" \
    -o "-p ${PGPORT} -k /tmp -c listen_addresses='${PGHOST}'" \
    -l /tmp/pixdrift-pg.log -w start
fi

psql() { "$PGBIN/psql" -h /tmp -p "$PGPORT" -U postgres -v ON_ERROR_STOP=1 "$@"; }

log "ensuring roles + databases"
psql -d postgres <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='pixdrift_owner') THEN
    CREATE ROLE pixdrift_owner LOGIN PASSWORD '${OWNER_PW}' CREATEDB;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='pixdrift_app') THEN
    CREATE ROLE pixdrift_app LOGIN PASSWORD '${APP_PW}';
  END IF;
END \$\$;
SELECT 'create database pixdrift_idp owner pixdrift_owner'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='pixdrift_idp')\gexec
SELECT 'create database pixdrift_idp_test owner pixdrift_owner'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='pixdrift_idp_test')\gexec
SQL

echo
echo "# Connection strings (add to your shell/env):"
echo "export PIXDRIFT_DB_OWNER_URL='postgres://pixdrift_owner:${OWNER_PW}@${PGHOST}:${PGPORT}/pixdrift_idp'"
echo "export DATABASE_URL='postgres://pixdrift_app:${APP_PW}@${PGHOST}:${PGPORT}/pixdrift_idp'"
echo "export PIXDRIFT_TEST_OWNER_URL='postgres://pixdrift_owner:${OWNER_PW}@${PGHOST}:${PGPORT}/pixdrift_idp_test'"
echo "export PIXDRIFT_TEST_DATABASE_URL='postgres://pixdrift_app:${APP_PW}@${PGHOST}:${PGPORT}/pixdrift_idp_test'"
