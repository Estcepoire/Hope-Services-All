"use client";

import dynamic from "next/dynamic";
import type { LatLng } from "./location-picker";

const RouteMapLeaflet = dynamic(() => import("./route-map-leaflet"), {
  ssr: false,
  loading: () => <div className="h-full min-h-[320px] w-full animate-pulse bg-sand" />,
});

export function RouteMap(props: { from: LatLng; to: LatLng }) {
  return <RouteMapLeaflet {...props} />;
}
