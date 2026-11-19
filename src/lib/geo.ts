import "server-only";
import { prisma } from "@/lib/prisma";

// Dépôt principal, utilisé comme origine des tournées d'enlèvement.
// Centre d'Antananarivo par défaut : remplacez par les coordonnées réelles de votre dépôt.
export const DEPOT = { lat: -18.8792, lng: 47.5079 };

export type NearbyPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

/** Points d'apport actifs les plus proches, distance calculée par PostGIS. */
export async function nearestCollectionPoints(lat: number, lng: number, limit = 5) {
  return prisma.$queryRaw<NearbyPoint[]>`
    SELECT id, name, address, lat, lng,
           ST_DistanceSphere(ST_MakePoint(lng, lat), ST_MakePoint(${lng}, ${lat})) / 1000 AS "distanceKm"
    FROM "CollectionPoint"
    WHERE active = true
    ORDER BY "distanceKm"
    LIMIT ${limit}
  `;
}

/** Distance à vol d'oiseau en km (formule de haversine), pour les calculs sans base de données. */
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
