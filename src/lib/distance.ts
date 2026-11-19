// Calculs de distance sans base de données : utilisables côté serveur comme dans le navigateur.

// Dépôt principal, origine des tournées d'enlèvement.
// Centre d'Antananarivo par défaut : remplacez par les coordonnées réelles de votre dépôt.
export const DEPOT = { lat: -18.8792, lng: 47.5079 };

/** Distance à vol d'oiseau en km (formule de haversine). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Distance routière approximative : vol d'oiseau × 1,3, arrondie au km supérieur. */
export function roadKmFromDepot(point: { lat: number; lng: number }) {
  return Math.ceil(haversineKm(DEPOT, point) * 1.3);
}

/** Cadre de Madagascar, pour rejeter les positions manifestement fausses. */
export function isInMadagascar({ lat, lng }: { lat: number; lng: number }) {
  return lat >= -25.7 && lat <= -11.9 && lng >= 43.1 && lng <= 50.6;
}
