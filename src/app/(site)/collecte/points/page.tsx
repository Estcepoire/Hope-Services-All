import { Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PointsMap } from "@/components/points-map";
import { getCollectionPoints } from "@/lib/data";

export const metadata: Metadata = {
  title: "Points d'apport",
  description: "Les points d'apport HOPE Services à Antananarivo : déposez vos déchets triés, sans frais.",
};

export default function PointsPage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Points d&apos;apport</span>
          <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-6xl">Déposez près de chez vous</h1>
          <p className="max-w-2xl text-lg text-black/70">Sans frais d&apos;enlèvement : pesée et paiement sur place.</p>
        </div>
        <Link href="/collecte/declarer" className="rounded-full bg-foreground px-5 py-3 font-semibold text-white hover:bg-brand">
          Plutôt un enlèvement à domicile ?
        </Link>
      </section>
      <Suspense fallback={<div className="h-[480px] animate-pulse rounded-3xl bg-surface" />}>
        <Points />
      </Suspense>
    </div>
  );
}

async function Points() {
  await connection();
  const points = await getCollectionPoints();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* TODO : bouton « autour de moi » → nearestCollectionPoints() (src/lib/geo.ts) */}
      <div className="overflow-hidden rounded-3xl">
        <PointsMap points={points} />
      </div>
      <ul className="flex flex-col gap-3 lg:max-h-[480px] lg:overflow-y-auto">
        {points.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 rounded-3xl bg-surface p-5">
            <p className="font-bold">{p.name}</p>
            <p className="flex items-center gap-2 text-sm text-black/70"><MapPin aria-hidden className="h-4 w-4 shrink-0 text-brand" /> {p.address}</p>
            {p.openingHours ? (
              <p className="flex items-center gap-2 text-sm text-black/70"><Clock aria-hidden className="h-4 w-4 shrink-0 text-brand" /> {p.openingHours}</p>
            ) : null}
            <div className="flex flex-wrap gap-1 pt-1">
              {p.acceptedMaterials.map((m) => (
                <span key={m.code} className="rounded-full bg-background px-2 py-0.5 text-xs text-black/60">{m.name}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
