"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import type { MapPoint } from "./points-map";

// Centre d'Antananarivo
const CENTER: [number, number] = [-18.8792, 47.5079];

export default function PointsMapLeaflet({ points }: { points: MapPoint[] }) {
  return (
    <MapContainer center={CENTER} zoom={13} className="h-[480px] w-full rounded-2xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* CircleMarker plutôt que Marker : évite les icônes PNG que le bundler ne trouve pas */}
      {points.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={10} pathOptions={{ color: "#1f7a45", fillOpacity: 0.7 }}>
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {p.address}
            {p.openingHours ? (
              <>
                <br />
                {p.openingHours}
              </>
            ) : null}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
