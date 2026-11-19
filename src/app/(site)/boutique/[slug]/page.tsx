import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getProduct, getProducts } from "@/lib/data";
import { formatAriary } from "@/lib/format";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/boutique/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return { title: product?.name ?? "Produit introuvable" };
}

export default function ProductPage({ params }: PageProps<"/boutique/[slug]">) {
  return (
    <Suspense fallback={<div className="aspect-square max-w-md animate-pulse rounded-2xl bg-brand-light" />}>
      <ProductDetails params={params} />
    </Suspense>
  );
}

async function ProductDetails({ params }: Pick<PageProps<"/boutique/[slug]">, "params">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="grid gap-10 md:grid-cols-2">
      <div className="aspect-square rounded-2xl bg-brand-light" />
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <p className="text-2xl font-bold text-brand">{formatAriary(product.price)}</p>
        <p className="text-black/70">{product.description}</p>
        {product.recycledKg ? (
          <p className="rounded-xl bg-brand-light p-4 text-sm">
            ♻️ Chaque exemplaire contient <strong>{product.recycledKg} kg</strong> de déchets recyclés.
            {/* TODO : traçabilité, lister les lots (ProductLot → MaterialLot) et leur origine */}
          </p>
        ) : null}
        <p className="text-sm text-black/60">{product.stock > 0 ? `${product.stock} en stock` : "Rupture de stock"}</p>
        {/* TODO : bouton « Ajouter au panier » (panier côté client + commande via server action) */}
        <button disabled className="w-fit rounded-full bg-brand px-5 py-3 font-medium text-white opacity-50">
          Ajouter au panier (bientôt)
        </button>
      </div>
    </div>
  );
}
