import { Recycle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { getImpactStats, getProducts } from "@/lib/data";

// Accueil inspiré de HopeRise (Dribbble) : titre géant avec pastille visuelle, compteurs
// d'impact en vert vif, parcours en étapes, appels à l'action francs.

const steps = [
  { n: "01", title: "Vous triez", text: "Plastique, carton, métal, verre, électronique : séparez vos déchets, même en petite quantité." },
  { n: "02", title: "Nous collectons", text: "Déposez-les dans un point d'apport ou faites-les enlever à domicile. Pesée sur place." },
  { n: "03", title: "Vous êtes payé", text: "MVola, Orange Money, Airtel Money, espèces ou crédits sur la boutique, au choix." },
  { n: "04", title: "Nous transformons", text: "La matière devient des produits utiles, vendus ici avec leur origine." },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-24 pb-10">
      {/* Héros */}
      <section className="flex flex-col items-center gap-8 pt-6 text-center">
        <span className="rounded-full bg-surface px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand">
          Recyclage solidaire à Antananarivo
        </span>
        <h1 className="max-w-4xl text-5xl font-extrabold leading-[0.95] sm:text-7xl">
          Vos déchets
          {/* Pastille dans le titre (signature HopeRise) : symbole du recyclage aux couleurs du logo */}
          <span aria-hidden className="mx-3 inline-flex h-[0.8em] w-[1.6em] translate-y-[0.08em] items-center justify-center rounded-full bg-gradient-to-r from-brand to-accent align-baseline text-white">
            <Recycle className="h-[0.55em] w-[0.55em]" strokeWidth={2.2} />
          </span>
          ont de la valeur
        </h1>
        <p className="max-w-2xl text-lg text-black/70">
          HOPE Services rachète les déchets triés des particuliers et des entreprises, les transforme dans son
          atelier et vend des produits recyclés fabriqués à Madagascar.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/collecte/declarer" className="rounded-full bg-brand px-6 py-3.5 font-semibold text-white hover:bg-brand-dark">
            Faire collecter mes déchets
          </Link>
          <Link href="/collecte/estimer" className="rounded-full border border-black/20 bg-surface px-6 py-3.5 font-semibold hover:border-brand hover:text-brand">
            Combien ça vaut ? →
          </Link>
        </div>
      </section>

      {/* Photo de terrain */}
      <figure className="relative -mt-12 aspect-[16/9] overflow-hidden rounded-[2.5rem] sm:aspect-[21/9]">
        <Image
          src="/images/hope/poubelles-tri.jpg"
          alt="Une membre de l'équipe HOPE Services devant quatre poubelles de tri : biodégradable, aluminium, plastique, carton"
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover"
        />
        <figcaption className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 sm:bottom-6 sm:left-6">
          {["Biodégradable", "Aluminium", "Plastique", "Carton"].map((t, i) => (
            <span key={t} className={`rounded-full px-3 py-1 text-xs font-semibold text-white sm:text-sm ${["bg-orange-500", "bg-red-600", "bg-green-700", "bg-blue-600"][i]}`}>
              {t}
            </span>
          ))}
        </figcaption>
      </figure>

      {/* Impact */}
      <section className="full-bleed rounded-t-[3rem] bg-surface px-4 sm:px-8 lg:px-12 py-16 sm:rounded-t-[5rem]">
        <div className="mx-auto flex max-w-[1920px] flex-col items-center gap-10 text-center">
          <div>
            <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Notre impact</span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">Ensemble, on nettoie Tana</h2>
          </div>
          <Suspense fallback={<ImpactNumbers kg="…" collections="…" points="…" />}>
            <Impact />
          </Suspense>
        </div>
      </section>

      {/* Étapes */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-5xl">Comment ça marche</h2>
          <Link href="/collecte" className="font-semibold text-brand">Tout sur la collecte →</Link>
        </div>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n} className="flex flex-col gap-3 rounded-3xl bg-surface p-6">
              <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-accent">{s.n}</span>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="text-sm text-black/70">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Publics */}
      <section className="grid gap-4 md:grid-cols-2">
        <Audience
          tone="light"
          label="Particuliers"
          title="Videz vos placards, remplissez votre MVola"
          text="Bouteilles, canettes, cartons : apportez-les au point le plus proche ou demandez un passage."
          href="/collecte/points"
          cta="Trouver un point d'apport"
        />
        <Audience
          tone="dark"
          label="Entreprises"
          title="Vos déchets de production valorisés"
          text="Enlèvements réguliers, pesée certifiée, paiement et suivi en ligne pour vos volumes professionnels."
          href="/collecte/declarer"
          cta="Planifier un enlèvement"
        />
      </section>

      {/* Boutique */}
      <section className="flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Boutique verte</span>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-5xl">Des déchets devenus objets</h2>
          </div>
          <Link href="/boutique" className="font-semibold text-brand">Voir toute la boutique →</Link>
        </div>
        <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl bg-surface" />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      {/* Appel final */}
      <section className="flex flex-col items-center gap-6 rounded-[2.5rem] bg-brand px-6 py-16 text-center text-white">
        <h2 className="max-w-2xl text-3xl font-extrabold sm:text-5xl">Un sac de déchets triés, c&apos;est déjà un geste payé</h2>
        <Link href="/collecte/estimer" className="rounded-full bg-white px-6 py-3.5 font-semibold text-brand hover:bg-brand-light">
          Estimer mes déchets
        </Link>
      </section>
    </div>
  );
}

// Données lues à la requête (et mises en cache) : le build n'a pas besoin de la base.
async function Impact() {
  await connection();
  const stats = await getImpactStats();
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
  return <ImpactNumbers kg={fmt(stats.kgRecycled)} collections={fmt(stats.collections)} points={fmt(stats.points)} />;
}

function ImpactNumbers({ kg, collections, points }: { kg: string; collections: string; points: string }) {
  return (
    <dl className="grid w-full gap-10 sm:grid-cols-3">
      {[
        { value: kg, unit: "kg", label: "de déchets recyclés" },
        { value: collections, unit: "", label: "collectes réalisées" },
        { value: points, unit: "", label: "points d'apport à Tana" },
      ].map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-1">
          <dd className="font-[family-name:var(--font-display)] text-6xl font-extrabold text-accent sm:text-7xl">
            {s.value}
            {s.unit && <span className="ml-1 text-3xl">{s.unit}</span>}
          </dd>
          <dt className="text-sm font-medium text-black/60">{s.label}</dt>
        </div>
      ))}
    </dl>
  );
}

async function FeaturedProducts() {
  await connection();
  const products = (await getProducts()).slice(0, 4);
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {products.map((p) => <ProductCard key={p.slug} product={p} />)}
    </div>
  );
}

function Audience(props: { tone: "light" | "dark"; label: string; title: string; text: string; href: string; cta: string }) {
  const dark = props.tone === "dark";
  return (
    <div className={`flex flex-col gap-4 rounded-[2rem] p-8 sm:p-10 ${dark ? "bg-foreground text-white" : "bg-sand"}`}>
      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${dark ? "bg-white/10" : "bg-surface text-brand"}`}>
        {props.label}
      </span>
      <h3 className="text-2xl font-extrabold sm:text-3xl">{props.title}</h3>
      <p className={dark ? "text-white/70" : "text-black/70"}>{props.text}</p>
      <Link href={props.href} className={`mt-auto w-fit rounded-full px-5 py-3 font-semibold ${dark ? "bg-accent text-foreground" : "bg-foreground text-white"}`}>
        {props.cta}
      </Link>
    </div>
  );
}
