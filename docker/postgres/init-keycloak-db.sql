-- Exécuté par l'image postgres au tout premier démarrage (volume vide) :
-- base séparée pour Keycloak, à côté de la base de l'application.
CREATE DATABASE keycloak OWNER hope;
