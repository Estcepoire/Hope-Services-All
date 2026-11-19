"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip } from "react-leaflet";
import type { LatLng } from "./location-picker";

/** Carte de suivi inspirée de Delivery (Dribbble) : dépôt → lieu d'enlèvement, trajet en pointillés. */
export default function RouteMapLeaflet({ from, to }: { from: LatLng; to: LatLng }) {
  const bounds: [[number, number], [number, number]] = [
    [Math.min(from.lat, to.lat), Math.min(from.lng, to.lng)],
    [Math.max(from.lat, to.lat), Math.max(from.lng, to.lng)],
  ];
  return (
    <MapContainer bounds={bounds} boundsOptions={{ padding: [40, 40], maxZoom: 16 }} className="h-full min-h-[320px] w-full" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={[[from.lat, from.lng], [to.lat, to.lng]]} pathOptions={{ color: "#1c1b18", weight: 3, dashArray: "6 8" }} />
      <CircleMarker center={[from.lat, from.lng]} radius={8} pathOptions={{ color: "#1c1b18", fillColor: "#fff", fillOpacity: 1 }}>
        <Tooltip permanent direction="top">Dépôt HOPE</Tooltip>
      </CircleMarker>
      <CircleMarker center={[to.lat, to.lng]} radius={10} pathOptions={{ color: "#1f6b3a", fillColor: "#6ab030", fillOpacity: 1 }}>
        <Tooltip permanent direction="top">Enlèvement</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
