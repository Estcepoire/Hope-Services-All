// Coordonnées de HOPE Services, affichées sur le site (contact, pied de page).
// Source : page Facebook publique de l'entreprise (facebook.com/hopeservices.sarlu), novembre 2026.
// Un champ laissé à null n'est pas affiché, pour ne jamais publier d'information inventée.

export const COMPANY = {
  name: "HOPE Services",
  legalForm: "SARLU",
  slogan: "Serving is our nature",
  description: "Service de collecte et de vente de déchets recyclables (matières premières de recyclage).",
  city: "Antananarivo, Madagascar",
  address: "Andoharanofotsy, Antananarivo, Madagascar",
  phone: "034 66 829 73",
  email: "hopeservices.sarlu@gmail.com",
  website: "https://hopeservices.mg",
  facebook: "https://www.facebook.com/hopeservices.sarlu/",
  whatsapp: null as string | null, // numéro international sans +, ex : "261346682973", si WhatsApp est utilisé
  openingHours: null as string | null, // ex : "Lundi au samedi, 8h–17h"
};
