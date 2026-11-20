#!/usr/bin/env bash
# Démo publique depuis la machine de développement (tunnels cloudflared vers le site et Keycloak).
#   bash scripts/demo-publique.sh https://<site>.trycloudflare.com [--garder-mots-de-passe]
#
# - ajoute l'adresse publique du site au client Keycloak hope-web (localhost reste autorisé)
# - sauf avec --garder-mots-de-passe : donne de NOUVEAUX mots de passe aléatoires aux comptes de test
#   *@hope.test (ceux du dépôt sont publics) et à la console Keycloak, et les écrit dans
#   comptes-demo.local.md (ignoré par git)
# Normalement lancé par scripts/demo-relancer.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${1:?Usage : bash scripts/demo-publique.sh https://<site>.trycloudflare.com [--garder-mots-de-passe]}"
SITE_URL="${SITE_URL%/}"
KEEP_PASSWORDS="${2:-}"
OUT=comptes-demo.local.md

# Mot de passe actuel de la console : variable, sinon fichier de démo, sinon « admin » (premier lancement).
if [[ -z "${KC_ADMIN_PASSWORD:-}" && -f "$OUT" ]]; then
  KC_ADMIN_PASSWORD=$(grep "^Console Keycloak" "$OUT" | grep -o '`[^`]*`' | tail -1 | tr -d '`' || true)
fi
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

if [[ "$KEEP_PASSWORDS" == "--garder-mots-de-passe" && -f "$OUT" ]]; then
  # Mêmes comptes : on met seulement à jour l'adresse du site dans le fichier.
  sed -i "s|^Site : .*|Site : ${SITE_URL}|" "$OUT"
  echo "Mots de passe conservés. Adresse mise à jour dans ${OUT}"
  exit 0
fi

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
chmod 600 "$OUT"

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
} >> "$OUT"

echo "Mots de passe changés. Détails dans ${OUT}"
