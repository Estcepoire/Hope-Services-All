"use client";

import { QUALITY_LABELS, type EstimationLine, type Quality } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";

export type Material = { id: string; code: string; name: string; pricePerKg: number };
export type WasteLine = { key: number; materialId: string; kg: number; quality: Quality };

let nextKey = 1;
export function newLine(materials: Material[], kg = 1): WasteLine {
  return { key: nextKey++, materialId: materials[0]?.id ?? "", kg, quality: "TRIE_PROPRE" };
}

/** Lignes valides, prêtes pour estimate(). */
export function toEstimationLines(lines: WasteLine[], materials: Material[]): EstimationLine[] {
  const byId = new Map(materials.map((m) => [m.id, m]));
  return lines
    .filter((l) => byId.has(l.materialId))
    .map((l) => {
      const m = byId.get(l.materialId)!;
      return { materialCode: m.code, pricePerKg: m.pricePerKg, kg: l.kg, quality: l.quality };
    });
}

/** Éditeur de la liste des déchets (matériau, poids, qualité), partagé par le simulateur et le formulaire. */
export function WasteLinesEditor({
  materials,
  lines,
  onChange,
}: {
  materials: Material[];
  lines: WasteLine[];
  onChange: (lines: WasteLine[]) => void;
}) {
  const update = (key: number, patch: Partial<WasteLine>) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <div className="flex flex-col gap-3">
      {lines.map((l) => (
        <div key={l.key} className="grid gap-2 rounded-xl border border-black/10 p-3 sm:grid-cols-[2fr_1fr_1.5fr_auto]">
          <select
            aria-label="Matériau"
            value={l.materialId}
            onChange={(e) => update(l.key, { materialId: e.target.value })}
            className="rounded-lg border border-black/15 p-2"
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({formatAriary(m.pricePerKg)}/kg)
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input
              type="number"
              aria-label="Poids en kg"
              min={0}
              step={0.5}
              value={l.kg}
              onChange={(e) => update(l.key, { kg: Number(e.target.value) })}
              className="w-full rounded-lg border border-black/15 p-2"
            />
            kg
          </label>
          <select
            aria-label="Qualité du tri"
            value={l.quality}
            onChange={(e) => update(l.key, { quality: e.target.value as Quality })}
            className="rounded-lg border border-black/15 p-2"
          >
            {Object.entries(QUALITY_LABELS).map(([q, label]) => (
              <option key={q} value={q}>{label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onChange(lines.filter((x) => x.key !== l.key))}
            disabled={lines.length === 1}
            className="px-2 text-black/50 hover:text-red-600 disabled:opacity-30"
            aria-label="Retirer cette ligne"
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...lines, newLine(materials)])} className="w-fit text-sm font-medium text-brand">
        + Ajouter un matériau
      </button>
    </div>
  );
}
