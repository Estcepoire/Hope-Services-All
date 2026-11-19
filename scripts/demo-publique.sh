#!/usr/bin/env bash
# Démo publique depuis la machine de développement (tunnels cloudflared vers le site et Keycloak).
#   bash scripts/demo-publique.sh https://<site>.trycloudflare.com
#
# - ajoute l'adresse publique du site au client Keycloak hope-web (localhost reste autorisé)
# - donne de NOUVEAUX mots de passe aléatoires aux comptes de test *@hope.test (ceux du dépôt sont publics)
# - change le mot de passe de la console d'administration Keycloak (admin/admin par défaut en dev)
# - écrit le tout dans comptes-demo.local.md (ignoré par git) pour le transmettre au client
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${1:?Usage : bash scripts/demo-publique.sh https://<site>.trycloudflare.com}"
SITE_URL="${SITE_URL%/}"
OUT=comptes-demo.local.md
KC_ADMIN_PASSWORD="${KC_ADMIN_PASSWORD:-admin}"

kcadm() { docker exec -i hope-keycloak /opt/keycloak/bin/kcadm.sh "$@"; }
newpass() { python3 -c "import secrets; print(secrets.token_urlsafe(12))"; }

kcadm config credentials --server http://localhost:8080 --realm master --user admin --password "$KC_ADMIN_PASSWORD" >/dev/null

CLIENT_ID=$(kcadm get clients -r hope -q clientId=hope-web --fields id --format csv --noquotes)
kcadm update "clients/${CLIENT_ID}" -r hope -f - <<EOF
{
  "redirectUris": ["http://localhost:3000/api/auth/callback/keycloak", "http://localhost:3100/api/auth/callback/keycloak", "${SITE_URL}/api/auth/callback/keycloak"],
  "webOrigins": ["http://localhost:3000", "http://localhost:3100", "${SITE_URL}"],
  "attributes": { "post.logout.redirect.uris": "http://localhost:3000/*##http://localhost:3100/*##${SITE_URL}/*" }
}
EOF
echo "Client hope-web : ${SITE_URL} autorisé"

{
  echo "# Comptes de démonstration HOPE Services"
  echo
  echo "Site : ${SITE_URL}"
  echo
  echo "⚠️ Fichier local, ignoré par git. Mots de passe générés le $(date '+%d/%m/%Y %H:%M')."
  echo
  echo "| Rôle | E-mail | Mot de passe |"
  echo "|---|---|---|"
} > "$OUT"

for role in particulier entreprise collecteur admin; do
  email="${role}@hope.test"
  pass=$(newpass)
  kcadm set-password -r hope --username "$email" --new-password "$pass"
  echo "| ${role} | ${email} | \`${pass}\` |" >> "$OUT"
done

ADMIN_PASS=$(newpass)
kcadm set-password -r master --username admin --new-password "$ADMIN_PASS"
{
  echo
  echo "Console Keycloak (pour vous uniquement, ne pas transmettre) : identifiant \`admin\`, mot de passe \`${ADMIN_PASS}\`"
  echo "Les scripts Keycloak lisent ce mot de passe dans KC_ADMIN_PASSWORD, ex. : KC_ADMIN_PASSWORD='…' npm run keycloak:google"
} >> "$OUT"

echo "Mots de passe changés. Détails dans ${OUT}"
