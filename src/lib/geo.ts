import "server-only";
import { prisma } from "@/lib/prisma";

export { DEPOT, haversineKm } from "@/lib/distance";

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
