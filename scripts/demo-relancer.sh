#!/usr/bin/env bash
# (Re)lance la démo publique depuis ce PC, en une commande :
#   bash scripts/demo-relancer.sh
#
# 1. arrête les anciens tunnels et l'ancien serveur de démo (port 3100)
# 2. ouvre deux tunnels Cloudflare (site + Keycloak) : nouvelles adresses https://….trycloudflare.com
# 3. autorise la nouvelle adresse dans Keycloak (mots de passe des comptes de test conservés)
# 4. démarre le site en mode production sur le port 3100 (build fait si absent ou avec --build)
#
# Les tunnels gratuits sont temporaires : après une coupure réseau ou un redémarrage du PC, relancer ce
# script (l'adresse change). Prérequis : Docker démarré (npm run db:up) et cloudflared installé dans
# ~/.local/opt/cloudflared/ (ou CLOUDFLARED=/chemin/vers/cloudflared).
set -euo pipefail
cd "$(dirname "$0")/.."

CLOUDFLARED="${CLOUDFLARED:-$HOME/.local/opt/cloudflared/cloudflared}"
LOGS=.demo
mkdir -p "$LOGS"

[[ -x "$CLOUDFLARED" ]] || { echo "cloudflared introuvable : $CLOUDFLARED"; exit 1; }
curl -sf http://localhost:8080/realms/hope >/dev/null || { echo "Keycloak ne répond pas : lancez d'abord « npm run db:up »."; exit 1; }

echo "1/4 Arrêt de l'ancienne démo…"
pkill -f "^$CLOUDFLARED tunnel" 2>/dev/null || true
pid=$(ss -ltnp 2>/dev/null | grep ":3100 " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
[[ -n "$pid" ]] && kill "$pid" && sleep 2

echo "2/4 Ouverture des tunnels…"
: > "$LOGS/tunnel-keycloak.log"
: > "$LOGS/tunnel-site.log"
nohup "$CLOUDFLARED" tunnel --no-autoupdate --url http://localhost:8080 > "$LOGS/tunnel-keycloak.log" 2>&1 &
nohup "$CLOUDFLARED" tunnel --no-autoupdate --url http://localhost:3100 > "$LOGS/tunnel-site.log" 2>&1 &
url_of() { grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$1" | head -1; }
for _ in $(seq 60); do
  KC_URL=$(url_of "$LOGS/tunnel-keycloak.log" || true)
  SITE_URL=$(url_of "$LOGS/tunnel-site.log" || true)
  [[ -n "$KC_URL" && -n "$SITE_URL" ]] && break
  sleep 1
done
[[ -n "${KC_URL:-}" && -n "${SITE_URL:-}" ]] || { echo "Les tunnels n'ont pas démarré (voir $LOGS/)."; exit 1; }

echo "3/4 Configuration de Keycloak…"
bash scripts/demo-publique.sh "$SITE_URL" --garder-mots-de-passe

echo "4/4 Démarrage du site…"
if [[ "${1:-}" == "--build" || ! -d .next-demo ]]; then
  NEXT_DIST_DIR=.next-demo npx next build > "$LOGS/build.log" 2>&1
fi
NEXT_DIST_DIR=.next-demo \
AUTH_URL="$SITE_URL" \
AUTH_TRUST_HOST=true \
AUTH_KEYCLOAK_ISSUER="$KC_URL/realms/hope" \
  nohup npx next start -p 3100 > "$LOGS/site.log" 2>&1 &

for _ in $(seq 30); do curl -sf -o /dev/null http://localhost:3100 && break; sleep 1; done

echo
echo "Démo en ligne : $SITE_URL"
echo "Comptes de test : comptes-demo.local.md"
