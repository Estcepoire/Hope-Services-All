# HOPE Services : plateforme web

Site de HOPE Services (Antananarivo) : vitrine, boutique de produits recyclés, collecte de déchets
géolocalisée et estimation de leur valeur.

## Démarrer en local

Prérequis : Node.js 20+, Docker.

```bash
npm install
cp .env.example .env      # si .env n'existe pas encore
npm run db:up             # lance PostgreSQL + PostGIS et Keycloak (docker-compose.yml)
npm run db:migrate        # crée les tables
npm run db:seed           # données d'exemple (matériaux, points d'apport, produits)
npm run dev               # http://localhost:3000
```

Autres commandes : `npm test` (tests unitaires), `npm run lint`, `npm run build`, `npm run db:studio`
(interface pour voir et modifier la base).

## Stack

- **Next.js 16** (App Router, Cache Components) + **Tailwind CSS 4**
- **PostgreSQL + PostGIS** via **Prisma 7** (adaptateur `@prisma/adapter-pg`)
- **Keycloak 26** pour les comptes et les rôles, branché via **Auth.js v5** (`src/auth.ts`)
- **Leaflet + OpenStreetMap** pour les cartes (gratuit, sans clé API)
- Montants en **Ariary** (entiers), paiements prévus : MVola, Orange Money, Airtel Money, espèces, crédits boutique

## Organisation

```
docker/
  keycloak/hope-realm.json   realm Keycloak (rôles, client hope-web, comptes de test)
  postgres/                  script de création de la base keycloak
prisma/
  schema.prisma        modèle de données (utilisateurs, matériaux, collecte, lots, boutique, paiements)
  migrations/          migrations SQL (la première active PostGIS)
  seed.ts              données d'exemple
src/
  app/
    (site)/            site public, avec en-tête et pied de page communs
      page.tsx         accueil + compteur d'impact
      boutique/        catalogue et fiches produits
      panier/
      collecte/        présentation, estimer/, points/ (carte), declarer/
      a-propos/  contact/
    collecteur/        interface mobile des collecteurs
    admin/             back-office : tableau de bord, collectes, tarifs, produits
  components/          en-tête, pied de page, simulateur, carte
  lib/
    estimation.ts      calcul de la valeur des déchets (fonction pure + tests)
    geo.ts             dépôt, point d'apport le plus proche (PostGIS), haversine
    data.ts            lectures publiques mises en cache
    prisma.ts          client base de données
    session.ts         requireRole() : contrôle de session et de rôle
  auth.ts              configuration Auth.js + Keycloak (rôles, synchronisation User, renouvellement)
  proxy.ts             redirection vers /connexion pour /admin, /collecteur, /compte
    format.ts          formatage en Ariary
```

## Démo publique depuis ce PC

`bash scripts/demo-relancer.sh` ouvre deux tunnels Cloudflare gratuits (site + Keycloak), autorise la
nouvelle adresse dans Keycloak et démarre le site en mode production sur le port 3100. L'adresse
(`https://….trycloudflare.com`) s'affiche à la fin et change à chaque relance : relancer après une coupure
réseau, une mise en veille ou un redémarrage. Ajouter `--build` après une modification du code.
Comptes de test et mots de passe : `comptes-demo.local.md` (local, ignoré par git).

## Comptes et rôles (Keycloak)

- Console Keycloak : http://localhost:8080/admin (identifiants de dev dans `docker-compose.yml`)
- Realm `hope` importé au premier démarrage depuis `docker/keycloak/hope-realm.json` : rôles
  `particulier` (par défaut à l'inscription), `entreprise`, `collecteur`, `admin`, et comptes de test
  `admin@hope.test`, `collecteur@hope.test`, `entreprise@hope.test`, `particulier@hope.test`
  (mot de passe de dev dans ce même fichier).
- Un compte entreprise ou collecteur s'attribue dans la console Keycloak (Users → Role mapping).
- À chaque connexion, l'utilisateur est créé ou mis à jour dans la table `User` (`keycloakId` = `sub`).
- Protection : `src/proxy.ts` redirige vers `/connexion` sans session ; `requireRole()`
  (`src/lib/session.ts`) vérifie le rôle dans chaque page protégée.
- Keycloak stocke ses données dans la base `keycloak` du conteneur `db` (créée par
  `docker/postgres/init-keycloak-db.sql` au premier démarrage).
- Le fichier du realm n'est relu que si le realm n'existe pas. Pour le réimporter après modification
  (⚠️ efface les comptes créés dans Keycloak) :
  `docker compose stop keycloak && docker exec hope-db psql -U hope -d hope_services -c "DROP DATABASE keycloak" -c "CREATE DATABASE keycloak OWNER hope" && npm run db:up`

## Connexion avec Google

Google passe par Keycloak (« fournisseur d'identité ») : le site ne parle qu'à Keycloak.

1. Sur https://console.cloud.google.com : créer un projet, puis **API et services → Écran de
   consentement OAuth** (type « Externe », nom « HOPE Services »).
2. **Identifiants → Créer des identifiants → ID client OAuth**, type « Application Web ».
   URI de redirection autorisé : `http://localhost:8080/realms/hope/broker/google/endpoint`
   (en production : `https://<domaine-keycloak>/realms/hope/broker/google/endpoint`).
3. Copier l'ID client et le secret dans `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), puis :
   `npm run keycloak:google`
4. Mettre `AUTH_GOOGLE_ENABLED="true"` dans `.env` pour afficher le bouton « Continuer avec Google »,
   et redémarrer `npm run dev`.

Un compte Google reçoit le rôle `particulier`, comme une inscription classique. Si l'e-mail existe déjà
dans Keycloak, Keycloak propose de relier les deux comptes.

## Estimation de la valeur

`valeur = Σ (kg × prix/kg × coefficient qualité) − frais d'enlèvement`

- Coefficients qualité : trié et propre ×1, trié mais sale ×0,7, mélangé ×0,4
- Enlèvement : forfait 2 000 Ar + 500 Ar/km, offert au-delà de 50 000 Ar. Aucuns frais en point d'apport.

Ces paramètres sont dans `src/lib/estimation.ts`. **Les prix au kilo du seed et les points d'apport sont
des exemples** : remplacez-les par vos valeurs réelles.

## Reste à faire (prochaines étapes)

1. Connexion par téléphone + code SMS (extension Keycloak + passerelle SMS malgache)
2. Formulaire de demande d'enlèvement (photos, GPS, server action)
3. Panier, commande et paiement mobile money
4. Édition des tarifs et des produits dans l'admin
5. Traçabilité produit ↔ lots de matière, carte de chaleur, PWA hors connexion
