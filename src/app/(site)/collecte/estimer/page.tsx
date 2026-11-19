import { Droplets, Layers, Scale } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Estimator } from "@/components/estimator";
import { getMaterials } from "@/lib/data";

export const metadata: Metadata = {
  title: "Estimer la valeur de mes déchets",
  description: "Simulez ce que vos déchets triés vous rapportent avec HOPE Services, à Antananarivo.",
};

const TIPS = [
  { Icon: Layers, title: "Séparez les matières", text: "Un sac par matière : le tri propre est payé au prix plein." },
  { Icon: Droplets, title: "Videz et rincez", text: "Bouteilles et canettes vides et rincées valent plus que mélangées et sales." },
  { Icon: Scale, title: "Pesée sur place", text: "Le montant final est fixé après pesée par notre collecteur." },
];

export default function EstimatePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Simulateur</span>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-6xl">Combien valent vos déchets ?</h1>
        <p className="max-w-2xl text-lg text-black/70">Estimation indicative, calculée avec nos prix au kilo du moment.</p>
      </section>

      <Suspense fallback={<div className="h-80 animate-pulse rounded-3xl bg-surface" />}>
        <EstimatorWithPrices />
      </Suspense>

      <section className="grid gap-4 md:grid-cols-3">
        {TIPS.map(({ Icon, title, text }) => (
          <div key={title} className="flex gap-4 rounded-3xl bg-surface p-6">
            <span aria-hidden className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-light text-brand">
              <Icon className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="text-sm text-black/70">{text}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

// Prix lus à la requête (et mis en cache) : le build n'a pas besoin de la base.
async function EstimatorWithPrices() {
  await connection();
  const materials = await getMaterials();
  return <Estimator materials={materials} />;
}
