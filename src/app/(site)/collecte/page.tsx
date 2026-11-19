import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Collecte des déchets" };

export default function CollectionPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Faites recycler vos déchets</h1>
        <p className="mt-2 max-w-2xl text-black/70">
          Particuliers et entreprises : nous rachetons vos déchets triés. Paiement par MVola, Orange Money,
          Airtel Money, en espèces ou en crédits sur la boutique.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card href="/collecte/estimer" title="Estimer la valeur" text="Simulez en quelques secondes ce que vos déchets vous rapportent." />
        <Card href="/collecte/points" title="Déposer en point d'apport" text="Trouvez le point d'apport le plus proche sur la carte. Aucuns frais." />
        <Card href="/collecte/declarer" title="Demander un enlèvement" text="Nous venons chercher vos déchets chez vous ou dans votre entreprise." />
      </div>
    </div>
  );
}

function Card({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-black/10 p-6 hover:border-brand">
      <h2 className="font-semibold text-brand">{title}</h2>
      <p className="mt-2 text-black/70">{text}</p>
    </Link>
  );
}
