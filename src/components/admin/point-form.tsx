"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LocationPicker, type LatLng } from "@/components/location-picker";
import { savePoint, type PointFormState } from "@/lib/actions/admin/points";

type Point = {
  id: string;
  name: string;
  address: string;
  district: string | null;
  openingHours: string | null;
  lat: number;
  lng: number;
  active: boolean;
  acceptedMaterials: { id: string }[];
};

const input = "w-full rounded border border-[#dfe7dc] bg-white p-2.5 text-sm focus:border-brand focus:outline-none";

export function PointForm({ point, materials }: { point?: Point; materials: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<PointFormState, FormData>(savePoint, {});
  const [f, setF] = useState({
    name: point?.name ?? "",
    address: point?.address ?? "",
    district: point?.district ?? "",
    openingHours: point?.openingHours ?? "",
    active: point?.active ?? true,
  });
  const [position, setPosition] = useState<LatLng | null>(point ? { lat: point.lat, lng: point.lng } : null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set(point ? point.acceptedMaterials.map((m) => m.id) : materials.map((m) => m.id)));
  const err = state.fieldErrors ?? {};
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_380px]">
      {point && <input type="hidden" name="id" value={point.id} />}
      <input type="hidden" name="lat" value={position?.lat ?? ""} />
      <input type="hidden" name="lng" value={position?.lng ?? ""} />
      {[...accepted].map((id) => <input key={id} type="hidden" name="materialIds" value={id} />)}

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" error={err.name}><input name="name" value={f.name} onChange={set("name")} required className={input} /></Field>
          <Field label="Adresse" error={err.address}><input name="address" value={f.address} onChange={set("address")} required className={input} /></Field>
          <Field label="Quartier / arrondissement"><input name="district" value={f.district} onChange={set("district")} className={input} /></Field>
          <Field label="Horaires"><input name="openingHours" value={f.openingHours} onChange={set("openingHours")} placeholder="Lun–Sam 8h–17h" className={input} /></Field>
        </div>
        <Field label="Position" error={err.lat ?? err.lng}>
          <LocationPicker value={position} onChange={setPosition} />
        </Field>
      </div>

      <aside className="flex h-fit flex-col gap-4 rounded border border-[#e6ece3] bg-[#fafcf9] p-4">
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-semibold text-brand-dark">Matériaux acceptés</legend>
          {materials.map((m) => (
            <label key={m.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={accepted.has(m.id)}
                onChange={(e) => setAccepted((s) => { const n = new Set(s); if (e.target.checked) n.add(m.id); else n.delete(m.id); return n; })}
              />
              {m.name}
            </label>
          ))}
        </fieldset>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="active" checked={f.active} onChange={(e) => setF((v) => ({ ...v, active: e.target.checked }))} />
          Visible sur la carte
        </label>
        {state.error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        <button disabled={pending} className="h-10 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Enregistrement…" : point ? "Enregistrer" : "Créer le point"}
        </button>
        <Link href="/admin/points" className="text-center text-sm text-[#5b6b5e] hover:text-brand">Annuler</Link>
      </aside>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span className="font-semibold text-brand-dark">{label}</span>
      {children}
      {error && <span className="text-red-600">{error}</span>}
    </div>
  );
}
