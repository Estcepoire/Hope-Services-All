import { BrickWall, House, NotebookPen, Recycle, ShoppingBag } from "lucide-react";

// Libellés français des valeurs énumérées, partagés par l'espace client, l'admin et l'espace collecteur.

export const STATUS_LABELS = {
  EN_ATTENTE: "En attente de planification",
  PLANIFIEE: "Enlèvement planifié",
  COLLECTEE: "Collectée, en attente de paiement",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
} as const;

export const STATUS_COLORS = {
  EN_ATTENTE: "bg-amber-100 text-amber-800",
  PLANIFIEE: "bg-blue-100 text-blue-800",
  COLLECTEE: "bg-violet-100 text-violet-800",
  PAYEE: "bg-green-100 text-green-800",
  ANNULEE: "bg-black/5 text-black/60",
} as const;

export const PAYOUT_LABELS = {
  MVOLA: "MVola",
  ORANGE_MONEY: "Orange Money",
  AIRTEL_MONEY: "Airtel Money",
  ESPECES: "Espèces",
  CREDIT_BOUTIQUE: "Crédits boutique",
} as const;

export const SLOT_LABELS = { MATIN: "Matin (8h–12h)", APRES_MIDI: "Après-midi (13h–17h)" } as const;

export const CATEGORY_LABELS = {
  MAISON: "Maison",
  MODE: "Mode et accessoires",
  CONSTRUCTION: "Construction",
  PAPETERIE: "Papeterie",
  AUTRE: "Autres",
} as const;

/** Teinte et illustration par catégorie, affichées tant qu'un produit n'a pas de photo. */
export const CATEGORY_STYLE = {
  MAISON: { bg: "bg-[#efe2cc]", Icon: House },
  MODE: { bg: "bg-[#e3ecd9]", Icon: ShoppingBag },
  CONSTRUCTION: { bg: "bg-[#e6e1dc]", Icon: BrickWall },
  PAPETERIE: { bg: "bg-[#f1e6d6]", Icon: NotebookPen },
  AUTRE: { bg: "bg-sand", Icon: Recycle },
} as const;

/** Tris de la boutique (?tri=…). */
export const SORTS = [
  { value: "nouveautes", label: "Nouveautés" },
  { value: "prix-croissant", label: "Prix croissant" },
  { value: "prix-decroissant", label: "Prix décroissant" },
] as const;
