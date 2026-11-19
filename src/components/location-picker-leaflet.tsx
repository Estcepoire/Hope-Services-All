"use client";

import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLng } from "./location-picker";

const CENTER: [number, number] = [-18.8792, 47.5079]; // Antananarivo

function ClickHandler({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

/** Recentre la carte quand la position vient du GPS. */
function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value) map.setView([value.lat, value.lng], Math.max(map.getZoom(), 16));
  }, [map, value]);
  return null;
}

export default function LocationPickerLeaflet({ value, onPick }: { value: LatLng | null; onPick: (p: LatLng) => void }) {
  return (
    <MapContainer center={CENTER} zoom={13} className="h-[320px] w-full cursor-crosshair rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter value={value} />
      {value && <CircleMarker center={[value.lat, value.lng]} radius={10} pathOptions={{ color: "#1f7a45", fillOpacity: 0.8 }} />}
    </MapContainer>
  );
}
