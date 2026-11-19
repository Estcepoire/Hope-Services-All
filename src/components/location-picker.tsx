"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

export type LatLng = { lat: number; lng: number };

const LocationPickerLeaflet = dynamic(() => import("./location-picker-leaflet"), {
  ssr: false,
  loading: () => <div className="h-[320px] w-full animate-pulse rounded-xl bg-brand-light" />,
});

/** Position du lieu d'enlèvement : GPS du téléphone ou clic sur la carte. */
export function LocationPicker({ value, onChange }: { value: LatLng | null; onChange: (p: LatLng) => void }) {
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  function locate() {
    if (!navigator.geolocation) return setGpsError("Votre navigateur ne permet pas la géolocalisation.");
    setLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocating(false);
        setGpsError("Position indisponible : cliquez directement sur la carte.");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={locate} disabled={locating} className="rounded-full border border-brand px-4 py-2 text-sm font-medium text-brand disabled:opacity-50">
          {locating ? "Localisation…" : "📍 Utiliser ma position"}
        </button>
        <span className="text-sm text-black/60">ou cliquez sur la carte à l&apos;endroit de l&apos;enlèvement</span>
      </div>
      {gpsError && <p className="text-sm text-red-600">{gpsError}</p>}
      <LocationPickerLeaflet value={value} onPick={onChange} />
    </div>
  );
}
