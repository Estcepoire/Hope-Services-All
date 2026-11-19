import Link from "next/link";
import { getImpactStats } from "@/lib/data";

const steps = [
  { title: "1. Collecte", text: "Déposez vos déchets dans un point d'apport ou demandez un enlèvement à domicile." },
  { title: "2. Tri et transformation", text: "Plastique, carton, métal… chaque matière est triée puis transformée dans notre atelier." },
  { title: "3. Boutique verte", text: "Les produits recyclés sont vendus en ligne, avec l'origine de leur matière." },
];

export default async function HomePage() {
  const stats = await getImpactStats();

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6">
        <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          Vos déchets ont de la valeur. <span className="text-brand">Nous les transformons.</span>
        </h1>
        <p className="max-w-2xl text-lg text-black/70">
          HOPE Services collecte les déchets recyclables des particuliers et des entreprises à Antananarivo,
          les rachète et les transforme en produits utiles.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/collecte/estimer" className="rounded-full bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
            Estimer la valeur de mes déchets
          </Link>
          <Link href="/boutique" className="rounded-full border border-brand px-5 py-3 font-medium text-brand hover:bg-brand-light">
            Voir la boutique
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat value={`${Math.round(stats.kgRecycled).toLocaleString("fr-FR")} kg`} label="de déchets recyclés" />
        <Stat value={stats.collections.toLocaleString("fr-FR")} label="collectes réalisées" />
        <Stat value={stats.points.toLocaleString("fr-FR")} label="points d'apport" />
      </section>

      <section className="grid gap-6 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="rounded-2xl border border-black/10 p-6">
            <h2 className="font-semibold text-brand">{s.title}</h2>
            <p className="mt-2 text-black/70">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-brand-light p-6">
      <p className="text-3xl font-bold text-brand">{value}</p>
      <p className="text-black/70">{label}</p>
    </div>
  );
}
