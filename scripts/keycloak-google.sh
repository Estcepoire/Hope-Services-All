#!/usr/bin/env bash
# Active (ou met à jour) la connexion Google dans le realm Keycloak "hope".
#
# Prérequis : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env (voir README, section Google).
# Usage     : npm run keycloak:google
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1090
set -a; source "${ENV_FILE:-.env}"; set +a

: "${GOOGLE_CLIENT_ID:?GOOGLE_CLIENT_ID manquant dans .env}"
: "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET manquant dans .env}"
CONTAINER="${KEYCLOAK_CONTAINER:-hope-keycloak}"
KC_ADMIN_USER="${KC_ADMIN_USER:-admin}"
KC_ADMIN_PASSWORD="${KC_ADMIN_PASSWORD:-admin}"

kcadm() { docker exec -i "$CONTAINER" /opt/keycloak/bin/kcadm.sh "$@"; }

kcadm config credentials --server http://localhost:8080 --realm master \
  --user "$KC_ADMIN_USER" --password "$KC_ADMIN_PASSWORD" >/dev/null

# Le secret passe par l'entrée standard (fichier JSON) plutôt que par la ligne de commande.
CONFIG=$(cat <<EOF
{
  "alias": "google",
  "providerId": "google",
  "displayName": "Google",
  "enabled": true,
  "trustEmail": true,
  "firstBrokerLoginFlowAlias": "first broker login",
  "config": {
    "clientId": "${GOOGLE_CLIENT_ID}",
    "clientSecret": "${GOOGLE_CLIENT_SECRET}",
    "defaultScope": "openid profile email",
    "syncMode": "IMPORT",
    "guiOrder": "1"
  }
}
EOF
)

if kcadm get identity-provider/instances/google -r hope >/dev/null 2>&1; then
  echo "$CONFIG" | kcadm update identity-provider/instances/google -r hope -f - >/dev/null
  echo "Connexion Google mise à jour."
else
  echo "$CONFIG" | kcadm create identity-provider/instances -r hope -f - >/dev/null
  echo "Connexion Google activée."
fi
echo "URI de redirection à déclarer chez Google : http://localhost:8080/realms/hope/broker/google/endpoint"
