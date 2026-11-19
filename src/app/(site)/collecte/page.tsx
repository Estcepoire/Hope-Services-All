import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Faq } from "@/components/faq";
import { getMaterials } from "@/lib/data";
import { formatAriary } from "@/lib/format";
import { Ban, Calculator, Cylinder, MapPin, Milk, Package, Plug, Recycle, Shirt, Sprout, Truck, Wine, type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Collecte des déchets",
  description: "Faites racheter vos déchets triés à Antananarivo : point d'apport gratuit ou enlèvement à domicile.",
};

const CATEGORY_NAMES: Record<string, { label: string; Icon: LucideIcon }> = {
  PLASTIQUE: { label: "Plastiques", Icon: Milk },
  PAPIER_CARTON: { label: "Papiers et cartons", Icon: Package },
  METAL: { label: "Métaux", Icon: Cylinder },
  VERRE: { label: "Verre", Icon: Wine },
  ELECTRONIQUE: { label: "Électronique", Icon: Plug },
  TEXTILE: { label: "Textile", Icon: Shirt },
  ORGANIQUE: { label: "Organique", Icon: Sprout },
  AUTRE: { label: "Autres", Icon: Recycle },
};

// À valider par HOPE Services : liste des déchets refusés et réponses de la FAQ.
const REFUSED = [
  "Déchets alimentaires et couches",
  "Produits chimiques, peintures, huiles",
  "Médicaments et déchets médicaux",
  "Piles et batteries non emballées",
];

const FAQ = [
  { q: "Faut-il une quantité minimum ?", a: "Non pour les points d'apport. Pour un enlèvement à domicile, le simulateur vous indique si les frais de déplacement dépassent la valeur de vos déchets : dans ce cas, le point d'apport est plus intéressant." },
  { q: "Quand suis-je payé ?", a: "Après la pesée par notre collecteur. Le paiement part sur le numéro mobile money indiqué dans votre demande, ou en espèces sur place, ou en crédits sur la boutique." },
  { q: "Pourquoi le montant final peut-il différer de l'estimation ?", a: "L'estimation se base sur le poids et la qualité que vous déclarez. Le montant final correspond à la pesée réelle et à l'état du tri constaté." },
  { q: "Les entreprises sont-elles concernées ?", a: "Oui : bureaux, commerces, hôtels, ateliers. Nous organisons des enlèvements réguliers, avec un suivi en ligne de chaque collecte." },
  { q: "Comment bien préparer mes déchets ?", a: "Videz et rincez les contenants, aplatissez les cartons et séparez les matières dans des sacs différents. Un tri propre est mieux payé." },
];

export default function CollectionPage() {
  return (
    <div className="flex flex-col gap-20">
      <section className="flex flex-col gap-6">
        <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">Collecte</span>
        <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-6xl">Vos déchets triés, rachetés au kilo</h1>
        <p className="max-w-2xl text-lg text-black/70">
          Particuliers et entreprises : apportez vos déchets dans un point d&apos;apport ou demandez un enlèvement.
          Nous pesons, nous payons, nous recyclons.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Way Icon={Calculator} title="Estimer" text="Découvrez en quelques secondes ce que vos déchets vous rapportent." href="/collecte/estimer" cta="Ouvrir le simulateur" />
        <Way Icon={MapPin} title="Déposer" text="Trouvez le point d'apport le plus proche. Aucuns frais, paiement sur place." href="/collecte/points" cta="Voir la carte" />
        <Way Icon={Truck} title="Faire enlever" text="Nous venons chez vous ou dans votre entreprise, au créneau qui vous arrange." href="/collecte/declarer" cta="Demander un enlèvement" dark />
      </section>

      <section className="flex flex-col gap-8">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ce que nous rachetons</h2>
          <p className="mt-2 text-black/70">Prix de base au kilo, pour un tri propre. Le simulateur applique la qualité de votre tri.</p>
        </div>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-3xl bg-surface" />}>
          <MaterialsGrid />
        </Suspense>
        <div className="rounded-3xl border-2 border-dashed border-black/15 p-6">
          <h3 className="flex items-center gap-2 font-bold"><Ban className="h-5 w-5 text-red-600" /> Nous ne prenons pas</h3>
          <ul className="mt-3 grid gap-2 text-sm text-black/70 sm:grid-cols-2">
            {REFUSED.map((r) => <li key={r}>• {r}</li>)}
          </ul>
        </div>
      </section>

      <section className="grid gap-10 md:grid-cols-[1fr_1.5fr]">
        <div>
          <h2 className="text-3xl font-extrabold sm:text-4xl">Questions fréquentes</h2>
          <p className="mt-3 text-black/70">
            Une autre question ? <Link href="/contact" className="font-semibold text-brand underline">Écrivez-nous</Link>.
          </p>
        </div>
        <Faq items={FAQ} />
      </section>
    </div>
  );
}

async function MaterialsGrid() {
  await connection();
  const materials = await getMaterials();
  const groups = Object.entries(Object.groupBy(materials, (m) => m.category));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map(([cat, items]) => (
        <div key={cat} className="flex flex-col gap-4 rounded-3xl bg-surface p-6">
          <h3 className="flex items-center gap-3 text-lg font-bold">
            <CategoryIcon cat={cat} />
            {CATEGORY_NAMES[cat]?.label ?? cat}
          </h3>
          <ul className="flex flex-col gap-2 text-sm">
            {items!.map((m) => (
              <li key={m.id} className="flex justify-between gap-3 border-b border-black/5 pb-2 last:border-0">
                <span>{m.name}</span>
                <span className="shrink-0 font-semibold text-brand">{formatAriary(m.pricePerKg)}/kg</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Way({ Icon, title, text, href, cta, dark }: { Icon: LucideIcon; title: string; text: string; href: string; cta: string; dark?: boolean }) {
  return (
    <Link href={href} className={`group flex flex-col gap-4 rounded-[2rem] p-8 transition hover:-translate-y-1 ${dark ? "bg-foreground text-white" : "bg-surface"}`}>
      <span aria-hidden className={`grid h-14 w-14 place-items-center rounded-2xl ${dark ? "bg-white/10 text-accent" : "bg-brand-light text-brand"}`}><Icon className="h-7 w-7" strokeWidth={1.6} /></span>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className={dark ? "text-white/70" : "text-black/70"}>{text}</p>
      <span className={`mt-auto font-semibold ${dark ? "text-accent" : "text-brand"}`}>{cta} →</span>
    </Link>
  );
}

function CategoryIcon({ cat }: { cat: string }) {
  const Icon = CATEGORY_NAMES[cat]?.Icon ?? Recycle;
  return (
    <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-brand-light text-brand">
      <Icon className="h-5 w-5" strokeWidth={1.8} />
    </span>
  );
}
