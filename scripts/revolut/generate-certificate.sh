#!/usr/bin/env bash
# Generates the dedicated X.509 identity for the Pixdrift <-> Revolut Business
# API connection. Nothing here is reused from TLS, Identity signing keys or SSH.
#
# Output goes to .secrets/revolut/, which is gitignored. The private key is
# never printed: the script prints the public certificate and tells you how to
# pipe the key into a secret store without it passing through your terminal
# scrollback.
#
#   bash scripts/revolut/generate-certificate.sh [--days 1825] [--out DIR]
#
# Revolut signs client assertions with PS256, so this must be an RSA key.
# 2048 bits is the size Revolut's own certificate guide uses.

set -euo pipefail

DAYS=1825
OUT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/.secrets/revolut"

# CN follows the host of the registered redirect URI, because that same host is
# the `iss` of every client assertion signed with this key. Revolut verifies the
# signature, not the CN, but keeping them equal means the certificate says out
# loud which deployment it belongs to.
CN="${REVOLUT_REDIRECT_URI:-}"
CN="${CN#*://}"
CN="${CN%%/*}"
SUBJECT="/CN=${CN:-pixdrift.com}/O=Landvex/C=SE"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days) DAYS="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --subject) SUBJECT="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "okänt argument: $1" >&2; exit 2 ;;
  esac
done

KEY="$OUT/revolut-private-key.pem"
CERT="$OUT/revolut-public-certificate.pem"

mkdir -p "$OUT"
chmod 700 "$OUT"

if [[ -e "$KEY" ]]; then
  echo "FEL: $KEY finns redan." >&2
  echo "Skapa aldrig en ny nyckel ovanpå en registrerad. Flytta undan den gamla först." >&2
  exit 1
fi

umask 077
openssl req -x509 -newkey rsa:2048 -sha256 -days "$DAYS" -nodes \
  -keyout "$KEY" -out "$CERT" -subj "$SUBJECT" 2>/dev/null
chmod 600 "$KEY"
chmod 644 "$CERT"

FINGERPRINT="sha256:$(openssl x509 -in "$CERT" -noout -fingerprint -sha256 | cut -d= -f2)"

# SPKI pin: SHA-256 over the public key, not over the certificate. The running
# deployment derives the same value from the private key it holds, which is how
# it can tell that its key belongs to the certificate registered at Revolut.
SPKI="$(openssl x509 -in "$CERT" -noout -pubkey \
  | openssl pkey -pubin -outform der \
  | openssl dgst -sha256 -binary \
  | openssl base64)"

NOT_AFTER="$(openssl x509 -in "$CERT" -noout -enddate | cut -d= -f2)"
EXPIRES_ISO="$(date -u -d "$NOT_AFTER" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null \
  || date -u -jf "%b %e %H:%M:%S %Y %Z" "$NOT_AFTER" +%Y-%m-%dT%H:%M:%SZ)"
CREATED_ISO="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat <<EOF

=== KLISTRA IN DET HÄR I REVOLUT (X509-fältet) ===

$(cat "$CERT")
=== SLUT PÅ CERTIFIKAT ===

Certifikatets metadata (dessa är inte hemliga):

  REVOLUT_CERTIFICATE_FINGERPRINT=$FINGERPRINT
  REVOLUT_CERTIFICATE_CREATED_AT=$CREATED_ISO
  REVOLUT_CERTIFICATE_EXPIRES_AT=$EXPIRES_ISO
  REVOLUT_CERTIFICATE_PUBLIC_KEY_SHA256=$SPKI

Den sista raden låter driften upptäcka en felparad nyckel direkt, istället för
att Revolut avvisar varje anrop utan att säga varför.

Privatnyckeln ligger i:

  $KEY

Den skrivs aldrig ut här. Lägg den i produktionens secret store utan att den
passerar historiken, t.ex.:

  vercel env add REVOLUT_PRIVATE_KEY production < $KEY

Radera den lokala kopian när den ligger i secret storen:

  shred -u $KEY 2>/dev/null || rm -P $KEY

EOF
