# Déploiement de HOPE Services (Oracle Cloud « Always Free »)

Tout tourne sur **un seul serveur** avec Docker : le site (Next.js), PostgreSQL + PostGIS, Keycloak, et
Caddy qui fournit le HTTPS automatiquement. Fichiers utilisés : `Dockerfile`, `docker-compose.prod.yml`,
`docker/caddy/Caddyfile`, `.env.production.example`, `scripts/keycloak-prod.sh`.

## 1. Créer le serveur (à faire vous-même)

1. Créer un compte sur https://cloud.oracle.com (carte bancaire demandée pour la vérification ; l'offre
   « Always Free » n'est pas facturée tant qu'on reste dans ses limites).
2. **Compute → Instances → Create instance** :
   - Image : **Ubuntu 24.04**
   - Shape : **VM.Standard.A1.Flex** (Ampere, ARM), **2 OCPU, 12 Go** (le maximum gratuit)
   - Ajouter votre clé SSH publique
   - En cas d'erreur « Out of capacity », réessayer plus tard ou dans un autre domaine de disponibilité.
3. **Réseau** : dans la « Security List » du sous-réseau, ouvrir les ports **80** et **443** (TCP) en entrée.

## 2. Nom de domaine

Deux noms pointant vers l'IP publique du serveur (enregistrements DNS de type A) :
- le site, ex. `hopeservices.mg`
- Keycloak, ex. `auth.hopeservices.mg`

Sans domaine pour l'instant : **sslip.io** fonctionne sans inscription, ex. `141.145.1.2.sslip.io` et
`auth.141.145.1.2.sslip.io` (remplacer par votre IP).

## 3. Installer Docker et le projet

```bash
ssh ubuntu@<IP_DU_SERVEUR>
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git
sudo usermod -aG docker $USER && newgrp docker
# Ubuntu sur Oracle bloque aussi les ports dans iptables :
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

git clone https://github.com/Estcepoire/Hope-Services-All.git hope && cd hope
cp .env.production.example .env.production
nano .env.production   # remplir domaines et secrets (openssl rand -base64 32 pour chaque secret)
```

## 4. Lancer

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
# attendre ~1 minute que Keycloak démarre, puis une seule fois :
bash scripts/keycloak-prod.sh
```

Le script configure le client Keycloak pour votre domaine et **supprime les comptes de test**
(`*@hope.test`), dont les mots de passe sont publics dans le dépôt.

Premier administrateur : se créer un compte sur le site, puis dans la console Keycloak
(`https://<AUTH_DOMAIN>/admin`, identifiants `KEYCLOAK_ADMIN_*`) : Realm **hope** → Users → votre
compte → Role mapping → ajouter `admin`.

Données de départ (matériaux, points d'apport, produits d'exemple) si souhaité :
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm migrate npx prisma db seed
```

## 5. Mettre à jour

```bash
cd hope && git pull
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```
Les migrations de base s'appliquent automatiquement (service `migrate`).

## 6. Sauvegardes (à mettre en place)

La base (site + Keycloak) et les photos sont dans des volumes Docker. Exemple de sauvegarde quotidienne :
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T db pg_dumpall -U hope | gzip > ~/sauvegarde-$(date +%F).sql.gz
```
Copier ces fichiers hors du serveur (Oracle Object Storage, Google Drive…).

## Points d'attention

- Oracle peut récupérer une instance gratuite jugée inactive ; un site visité régulièrement n'est pas concerné.
- Configurer l'envoi d'e-mails dans Keycloak (Realm settings → Email) pour la vérification d'adresse et
  « mot de passe oublié ».
- Connexion Google en production : URI de redirection `https://<AUTH_DOMAIN>/realms/hope/broker/google/endpoint`.
