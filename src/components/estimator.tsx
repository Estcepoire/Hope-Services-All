"use client";

import { useState } from "react";
import { estimate, QUALITY_LABELS, type Mode, type Quality } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";

type Material = { id: string; code: string; name: string; pricePerKg: number };
type Line = { key: number; materialId: string; kg: number; quality: Quality };

export function Estimator({ materials }: { materials: Material[] }) {
  const [mode, setMode] = useState<Mode>("APPORT");
  const [distanceKm, setDistanceKm] = useState(3);
  const [lines, setLines] = useState<Line[]>([
    { key: 0, materialId: materials[0]?.id ?? "", kg: 5, quality: "TRIE_PROPRE" },
  ]);

  const byId = new Map(materials.map((m) => [m.id, m]));
  const result = estimate({
    mode,
    distanceKm,
    lines: lines
      .filter((l) => byId.has(l.materialId))
      .map((l) => {
        const m = byId.get(l.materialId)!;
        return { materialCode: m.code, pricePerKg: m.pricePerKg, kg: l.kg, quality: l.quality };
      }),
  });

  const update = (key: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {(["APPORT", "ENLEVEMENT"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === m ? "bg-brand text-white" : "border border-black/15"
              }`}
            >
              {m === "APPORT" ? "Je dépose en point d'apport" : "Enlèvement à domicile"}
            </button>
          ))}
        </div>

        {mode === "ENLEVEMENT" && (
          <label className="flex flex-col gap-1 text-sm">
            Distance approximative depuis notre dépôt : <strong>{distanceKm} km</strong>
            <input type="range" min={0} max={30} value={distanceKm} onChange={(e) => setDistanceKm(Number(e.target.value))} />
          </label>
        )}

        {lines.map((l) => (
          <div key={l.key} className="grid gap-2 rounded-xl border border-black/10 p-3 sm:grid-cols-[2fr_1fr_1.5fr_auto]">
            <select value={l.materialId} onChange={(e) => update(l.key, { materialId: e.target.value })} className="rounded-lg border border-black/15 p-2">
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({formatAriary(m.pricePerKg)}/kg)
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={0.5}
                value={l.kg}
                onChange={(e) => update(l.key, { kg: Number(e.target.value) })}
                className="w-full rounded-lg border border-black/15 p-2"
              />
              kg
            </label>
            <select value={l.quality} onChange={(e) => update(l.key, { quality: e.target.value as Quality })} className="rounded-lg border border-black/15 p-2">
              {Object.entries(QUALITY_LABELS).map(([q, label]) => (
                <option key={q} value={q}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
              disabled={lines.length === 1}
              className="px-2 text-black/50 hover:text-red-600 disabled:opacity-30"
              aria-label="Retirer cette ligne"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={() =>
            setLines((ls) => [...ls, { key: Date.now(), materialId: materials[0]?.id ?? "", kg: 1, quality: "TRIE_PROPRE" }])
          }
          className="w-fit text-sm font-medium text-brand"
        >
          + Ajouter un matériau
        </button>
      </div>

      <aside className="h-fit rounded-2xl bg-brand-light p-6">
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><dt>Valeur des matériaux</dt><dd>{formatAriary(result.gross)}</dd></div>
          {mode === "ENLEVEMENT" && (
            <div className="flex justify-between">
              <dt>Frais d&apos;enlèvement</dt>
              <dd>{result.pickupFee ? `− ${formatAriary(result.pickupFee)}` : "Offerts"}</dd>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-black/10 pt-3 text-lg font-bold text-brand">
            <dt>Vous recevez environ</dt><dd>{formatAriary(result.net)}</dd>
          </div>
        </dl>
        <a href={mode === "APPORT" ? "/collecte/points" : "/collecte/declarer"} className="mt-6 block rounded-full bg-brand px-4 py-3 text-center font-medium text-white hover:bg-brand-dark">
          {mode === "APPORT" ? "Trouver un point d'apport" : "Demander un enlèvement"}
        </a>
      </aside>
    </div>
  );
}
