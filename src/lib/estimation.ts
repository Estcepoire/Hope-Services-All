// Estimation de la valeur d'un lot de déchets.
// Fonction pure, utilisable côté serveur comme dans le navigateur (simulateur en direct).
//
//   valeur = Σ (kg × prix/kg × coefficient qualité) − frais d'enlèvement
//
// Les frais d'enlèvement ne s'appliquent qu'en mode ENLEVEMENT ; un apport en point de collecte n'en a pas.

export type Quality = "TRIE_PROPRE" | "TRIE_SALE" | "MELANGE";
export type Mode = "ENLEVEMENT" | "APPORT";

export const QUALITY_COEFFICIENTS: Record<Quality, number> = {
  TRIE_PROPRE: 1,
  TRIE_SALE: 0.7,
  MELANGE: 0.4,
};

export const QUALITY_LABELS: Record<Quality, string> = {
  TRIE_PROPRE: "Trié et propre",
  TRIE_SALE: "Trié mais sale",
  MELANGE: "Mélangé",
};

// Paramètres logistiques par défaut, à ajuster selon vos coûts réels (carburant, main-d'œuvre).
export const PICKUP_DEFAULTS = {
  baseFee: 2000, // MGA, forfait de déplacement
  perKm: 500, // MGA par km depuis le dépôt
  freeAboveValue: 50000, // enlèvement offert au-delà de cette valeur brute
};

export type EstimationLine = {
  materialCode: string;
  pricePerKg: number;
  kg: number;
  quality: Quality;
};

export type EstimationInput = {
  lines: EstimationLine[];
  mode: Mode;
  distanceKm?: number; // distance dépôt → déclarant, requise pour un enlèvement
  pickup?: typeof PICKUP_DEFAULTS;
};

export type EstimationResult = {
  lines: (EstimationLine & { value: number })[];
  gross: number;
  pickupFee: number;
  net: number;
};

export function estimate({
  lines,
  mode,
  distanceKm = 0,
  pickup = PICKUP_DEFAULTS,
}: EstimationInput): EstimationResult {
  const valued = lines.map((line) => ({
    ...line,
    value: Math.round(
      Math.max(0, line.kg) * line.pricePerKg * QUALITY_COEFFICIENTS[line.quality],
    ),
  }));
  const gross = valued.reduce((sum, l) => sum + l.value, 0);

  let pickupFee = 0;
  if (mode === "ENLEVEMENT" && gross < pickup.freeAboveValue) {
    pickupFee = Math.round(pickup.baseFee + Math.max(0, distanceKm) * pickup.perKm);
  }

  return { lines: valued, gross, pickupFee, net: Math.max(0, gross - pickupFee) };
}
