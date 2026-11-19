"use client";

import Link from "next/link";
import { useState } from "react";
import { estimate, type Mode } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";
import { newLine, toEstimationLines, WasteLinesEditor, type Material } from "./waste-lines";

export function Estimator({ materials }: { materials: Material[] }) {
  const [mode, setMode] = useState<Mode>("APPORT");
  const [distanceKm, setDistanceKm] = useState(3);
  const [lines, setLines] = useState(() => [newLine(materials, 5)]);

  const result = estimate({ mode, distanceKm, lines: toEstimationLines(lines, materials) });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
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

        <WasteLinesEditor materials={materials} lines={lines} onChange={setLines} />
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
        <Link href={mode === "APPORT" ? "/collecte/points" : "/collecte/declarer"} className="mt-6 block rounded-full bg-brand px-4 py-3 text-center font-medium text-white hover:bg-brand-dark">
          {mode === "APPORT" ? "Trouver un point d'apport" : "Demander un enlèvement"}
        </Link>
      </aside>
    </div>
  );
}
