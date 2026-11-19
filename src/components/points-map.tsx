"use client";

import dynamic from "next/dynamic";

export type MapPoint = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  openingHours: string | null;
};

// Leaflet a besoin de `window` : chargé uniquement dans le navigateur.
const PointsMapLeaflet = dynamic(() => import("./points-map-leaflet"), {
  ssr: false,
  loading: () => <div className="h-[480px] w-full animate-pulse rounded-2xl bg-brand-light" />,
});

export function PointsMap({ points }: { points: MapPoint[] }) {
  return <PointsMapLeaflet points={points} />;
}
