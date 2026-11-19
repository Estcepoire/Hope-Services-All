// Coordonnées de HOPE Services : valeurs PAR DÉFAUT. Elles sont modifiables dans l'admin (Paramètres),
// et lues sur le site via getCompany() (src/lib/data.ts).
// Source : page Facebook publique de l'entreprise (facebook.com/hopeservices.sarlu), novembre 2026.
// Un champ laissé à null n'est pas affiché, pour ne jamais publier d'information inventée.

export type Company = {
  name: string;
  legalForm: string;
  slogan: string;
  description: string;
  city: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string;
  facebook: string;
  whatsapp: string | null;
  openingHours: string | null;
};

export const COMPANY: Company = {
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
  whatsapp: null, // numéro international sans +, ex : "261346682973", si WhatsApp est utilisé
  openingHours: null, // ex : "Lundi au samedi, 8h–17h"
};
