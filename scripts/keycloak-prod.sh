#!/usr/bin/env bash
# Configure le realm « hope » pour la production, après le premier démarrage de Keycloak :
#   - client hope-web : adresses du vrai domaine (au lieu de localhost) et secret de production
#   - suppression des comptes de test *@hope.test (leurs mots de passe sont publics dans le dépôt)
#   - e-mail vérifié à l'inscription
#
# Usage (sur le serveur, dans le dossier du projet) :
#   bash scripts/keycloak-prod.sh
# Relançable sans risque.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck disable=SC1090
set -a; source "${ENV_FILE:-.env.production}"; set +a

: "${APP_DOMAIN:?APP_DOMAIN manquant}"
: "${KEYCLOAK_CLIENT_SECRET:?KEYCLOAK_CLIENT_SECRET manquant}"
: "${KEYCLOAK_ADMIN_USER:?KEYCLOAK_ADMIN_USER manquant}"
: "${KEYCLOAK_ADMIN_PASSWORD:?KEYCLOAK_ADMIN_PASSWORD manquant}"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "${ENV_FILE:-.env.production}")
kcadm() { "${COMPOSE[@]}" exec -T keycloak /opt/keycloak/bin/kcadm.sh "$@"; }

kcadm config credentials --server http://localhost:8080 --realm master \
  --user "$KEYCLOAK_ADMIN_USER" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null

APP="https://${APP_DOMAIN}"
CLIENT_ID=$(kcadm get clients -r hope -q clientId=hope-web --fields id --format csv --noquotes)

# Secret et adresses passés par l'entrée standard, pas sur la ligne de commande.
kcadm update "clients/${CLIENT_ID}" -r hope -f - <<EOF
{
  "rootUrl": "${APP}",
  "baseUrl": "/",
  "redirectUris": ["${APP}/api/auth/callback/keycloak"],
  "webOrigins": ["${APP}"],
  "secret": "${KEYCLOAK_CLIENT_SECRET}",
  "attributes": { "post.logout.redirect.uris": "${APP}/*", "pkce.code.challenge.method": "S256" }
}
EOF
echo "Client hope-web configuré pour ${APP}"

for id in $(kcadm get users -r hope -q email=@hope.test --fields id --format csv --noquotes); do
  kcadm delete "users/${id}" -r hope
  echo "Compte de test supprimé (${id})"
done

kcadm update realms/hope -s verifyEmail=true -s sslRequired=external >/dev/null
echo "Realm hope prêt pour la production."
echo "Pensez à configurer l'envoi d'e-mails (Realm settings → Email) pour la vérification et le mot de passe oublié."
