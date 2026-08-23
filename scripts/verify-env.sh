#!/usr/bin/env bash
#
# Verify a running Pixdrift environment: IdP health, OIDC discovery, JWKS, the
# public site and the kansli hub. Non-destructive. Exits non-zero on any failure.
#
#   scripts/verify-env.sh [BASE_URL]     # default http://127.0.0.1:3000
set -euo pipefail
BASE="${1:-http://127.0.0.1:3000}"
fail=0

check() { # code path label
  local want="$1" path="$2" label="$3"
  local got
  got=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${BASE}${path}")
  if [ "$got" = "$want" ]; then echo "  ok   ${got}  ${label} (${path})"; else echo "  FAIL ${got}!=${want}  ${label} (${path})"; fail=1; fi
}

echo "Verifying ${BASE}"
check 200 "/" "public home"
check 200 "/systems" "systems catalog"
check 200 "/how-it-works" "how it works"
check 200 "/company" "company"
check 200 "/documentation" "documentation"
check 200 "/kansli" "kansli hub (login gate)"
check 200 "/idp/halsa" "IdP health"
check 200 "/idp/.well-known/openid-configuration" "OIDC discovery"
check 200 "/idp/jwks.json" "JWKS"

echo "IdP issuer: $(curl -s --max-time 15 "${BASE}/idp/.well-known/openid-configuration" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("issuer","?"))' 2>/dev/null || echo '?')"

if [ "$fail" = "0" ]; then echo "ALL CHECKS PASSED"; else echo "SOME CHECKS FAILED"; exit 1; fi
