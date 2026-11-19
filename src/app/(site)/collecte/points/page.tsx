import type { Metadata } from "next";
import { PointsMap } from "@/components/points-map";
import { getCollectionPoints } from "@/lib/data";

export const metadata: Metadata = { title: "Points d'apport" };

export default async function PointsPage() {
  const points = await getCollectionPoints();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Points d&apos;apport</h1>
        <p className="mt-2 text-black/70">Déposez vos déchets triés près de chez vous, sans frais.</p>
      </div>
      {/* TODO : bouton « autour de moi » → nearestCollectionPoints() (src/lib/geo.ts) */}
      <PointsMap points={points} />
      <ul className="grid gap-4 sm:grid-cols-2">
        {points.map((p) => (
          <li key={p.id} className="rounded-xl border border-black/10 p-4">
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-black/70">{p.address}</p>
            {p.openingHours ? <p className="text-sm text-black/60">{p.openingHours}</p> : null}
            <p className="mt-2 text-xs text-black/50">
              Accepte : {p.acceptedMaterials.map((m) => m.name).join(", ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
