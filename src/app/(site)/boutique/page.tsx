import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { formatAriary } from "@/lib/format";

export const metadata: Metadata = { title: "Boutique verte" };

export default async function ShopPage() {
  const products = await getProducts();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Boutique verte</h1>
        <p className="mt-2 text-black/70">Des produits fabriqués à partir de déchets collectés à Antananarivo.</p>
      </div>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/boutique/${p.slug}`} className="flex h-full flex-col rounded-2xl border border-black/10 p-5 hover:border-brand">
              {/* TODO : afficher p.images[0] avec next/image une fois les photos ajoutées */}
              <div className="mb-4 aspect-square rounded-xl bg-brand-light" />
              <h2 className="font-semibold">{p.name}</h2>
              {p.recycledKg ? (
                <p className="text-sm text-brand">{p.recycledKg} kg de matière recyclée</p>
              ) : null}
              <p className="mt-auto pt-3 text-lg font-bold">{formatAriary(p.price)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
