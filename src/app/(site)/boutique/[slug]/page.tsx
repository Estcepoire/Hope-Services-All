import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { getProduct, getProducts } from "@/lib/data";
import { formatAriary } from "@/lib/format";
import { CATEGORY_LABELS, CATEGORY_STYLE } from "@/lib/labels";

// Pas de generateStaticParams : les fiches sont rendues à la requête (puis mises en cache),
// le build n'a donc pas besoin de la base de données.

export async function generateMetadata({ params }: PageProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Produit introuvable", description: product?.description };
}

const MAKING = [
  { title: "Collecte", text: "Les déchets sont rapportés par des habitants et des entreprises de Tana." },
  { title: "Tri et lavage", text: "Chaque matière est triée à la main, nettoyée et préparée." },
  { title: "Fabrication", text: "Notre atelier transforme la matière en objet, pièce par pièce." },
];

export default function ProductPage({ params }: PageProps<"/boutique/[slug]">) {
  return (
    <Suspense fallback={<div className="aspect-square max-w-md animate-pulse rounded-2xl bg-surface" />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/boutique/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const style = CATEGORY_STYLE[product.category];
  const others = (await getProducts()).filter((p) => p.slug !== slug).slice(0, 4);

  return (
    <div className="flex flex-col gap-20">
      <div className="flex flex-col gap-6">
        <nav aria-label="Fil d'Ariane" className="text-sm text-black/50">
          <Link href="/boutique" className="hover:text-brand">Boutique</Link>
          {" / "}
          <Link href={`/boutique?categorie=${product.category}`} className="hover:text-brand">{CATEGORY_LABELS[product.category]}</Link>
        </nav>

        <div className="grid gap-10 md:grid-cols-2">
          <div className={`relative grid aspect-square place-items-center overflow-hidden rounded-[2rem] ${style.bg}`}>
            {/* TODO : galerie product.images avec next/image */}
            <style.Icon aria-hidden className="h-32 w-32 text-black/20" strokeWidth={1} />
            {product.recycledKg ? (
              <span className="absolute left-4 top-4 rounded-full bg-highlight px-3 py-1 text-sm font-semibold">
                {product.recycledKg} kg recyclés
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="w-fit rounded-full bg-surface px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                {CATEGORY_LABELS[product.category]}
              </span>
              <h1 className="text-4xl font-extrabold sm:text-5xl">{product.name}</h1>
              <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-brand">{formatAriary(product.price)}</p>
            </div>
            <p className="text-lg text-black/70">{product.description}</p>

            <div className="flex flex-wrap items-center gap-3">
              {/* TODO : panier côté client + commande via server action */}
              <button disabled className="rounded-full bg-foreground px-6 py-3.5 font-semibold text-white opacity-50">
                Ajouter au panier (bientôt)
              </button>
              <span className={`text-sm font-medium ${product.stock > 0 ? "text-brand" : "text-red-600"}`}>
                {product.stock > 0 ? `● En stock (${product.stock})` : "● Épuisé"}
              </span>
            </div>

            {/* À confirmer par HOPE Services : lieu de fabrication et zone de livraison */}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Spec label="Fabrication" value="Atelier HOPE, Antananarivo" />
              <Spec label="Matière" value={product.recycledKg ? `${product.recycledKg} kg de déchets recyclés` : "Matière recyclée"} />
              <Spec label="Paiement" value="MVola, Orange Money, Airtel Money" />
              <Spec label="Livraison" value="Antananarivo et environs" />
            </dl>
          </div>
        </div>
      </div>

      <section className="full-bleed bg-surface px-4 sm:px-8 lg:px-12 py-16">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-8">
          <h2 className="text-3xl font-extrabold sm:text-4xl">De la poubelle à vos mains</h2>
          <ol className="grid gap-4 sm:grid-cols-3">
            {MAKING.map((m, i) => (
              <li key={m.title} className="flex flex-col gap-2 rounded-3xl bg-background p-6">
                <span className="font-[family-name:var(--font-display)] text-4xl font-extrabold text-accent">0{i + 1}</span>
                <h3 className="text-xl font-bold">{m.title}</h3>
                <p className="text-sm text-black/70">{m.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {others.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-3xl font-extrabold">Vous aimerez aussi</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {others.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-black/50">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
