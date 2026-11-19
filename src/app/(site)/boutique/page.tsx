import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { getProducts } from "@/lib/data";
import { CATEGORY_LABELS, SORTS } from "@/lib/labels";
import { Check, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = { title: "Boutique verte", description: "Objets fabriqués à partir de déchets collectés à Antananarivo." };

type Category = keyof typeof CATEGORY_LABELS;
const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

// Page boutique inspirée du thème Minimalista (ecomm.design) : bandeau gris avec titre, filtres en
// groupes repliables à gauche, barre d'outils (nombre de produits, tri), grille aérée.
// Les filtres passent par l'URL (?categorie=…&dispo=1&tri=…) : liens partageables.
export default function ShopPage(props: PageProps<"/boutique">) {
  return (
    <div className="flex flex-col gap-10">
      <header className="full-bleed bg-[#e7e6e2] px-4 sm:px-8 lg:px-12 py-14">
        <div className="mx-auto flex max-w-[1920px] flex-col gap-2">
          <nav aria-label="Fil d'Ariane" className="text-xs uppercase tracking-[0.12em] text-black/50">
            <Link href="/" className="hover:text-black">Accueil</Link> / Boutique
          </nav>
          <h1 className="font-sans text-4xl font-light tracking-tight sm:text-5xl">Boutique verte</h1>
          <p className="max-w-xl text-black/60">Chaque objet est fabriqué à partir de déchets collectés à Antananarivo.</p>
        </div>
      </header>
      <Suspense fallback={<div className="h-96 animate-pulse bg-[#efefed]" />}>
        <Catalog {...props} />
      </Suspense>
    </div>
  );
}

function href(params: Record<string, string | undefined>) {
  const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
  return q.size ? `/boutique?${q}` : "/boutique";
}

async function Catalog({ searchParams }: PageProps<"/boutique">) {
  const sp = await searchParams;
  const categorie = CATEGORIES.find((c) => c === sp.categorie);
  const dispo = sp.dispo === "1" ? "1" : undefined;
  const tri = SORTS.find((s) => s.value === sp.tri)?.value ?? "nouveautes";

  const all = await getProducts();
  let products = all.filter((p) => (!categorie || p.category === categorie) && (!dispo || p.stock > 0));
  if (tri === "prix-croissant") products = products.toSorted((a, b) => a.price - b.price);
  if (tri === "prix-decroissant") products = products.toSorted((a, b) => b.price - a.price);
  const present = CATEGORIES.filter((c) => all.some((p) => p.category === c));
  const keep = { tri: tri === "nouveautes" ? undefined : tri };

  return (
    <div className="grid gap-10 md:grid-cols-[220px_1fr]">
      <aside className="flex flex-col gap-2 text-sm">
        <p className="flex items-center gap-2 pb-2 font-medium"><SlidersHorizontal className="h-4 w-4" /> Filtres</p>
        <FilterGroup title="Catégorie">
          <FilterOption href={href({ ...keep, dispo })} active={!categorie} label="Tout" count={all.length} />
          {present.map((c) => (
            <FilterOption
              key={c}
              href={href({ ...keep, dispo, categorie: c })}
              active={categorie === c}
              label={CATEGORY_LABELS[c]}
              count={all.filter((p) => p.category === c).length}
            />
          ))}
        </FilterGroup>
        <FilterGroup title="Disponibilité">
          <FilterOption
            href={href({ ...keep, categorie, dispo: dispo ? undefined : "1" })}
            active={!!dispo}
            label="En stock uniquement"
            count={all.filter((p) => p.stock > 0).length}
            checkbox
          />
        </FilterGroup>
        {(categorie || dispo) && (
          <Link href={href(keep)} className="pt-2 text-black/50 underline hover:text-black">Effacer les filtres</Link>
        )}
      </aside>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <p className="text-sm text-black/60">{products.length} produit{products.length > 1 ? "s" : ""}</p>
          <SortSelect value={tri} />
        </div>
        {products.length === 0 ? (
          <p className="bg-[#efefed] p-10 text-center text-black/60">Aucun produit ne correspond à ces filtres.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 2xl:grid-cols-4">
            {products.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group border-t border-black/10 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
        {title}
        <span aria-hidden className="text-black/40 transition group-open:rotate-180">⌄</span>
      </summary>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </details>
  );
}

function FilterOption({ href, active, label, count, checkbox }: { href: string; active: boolean; label: string; count: number; checkbox?: boolean }) {
  return (
    <Link href={href} scroll={false} aria-current={active ? "true" : undefined} className="flex items-center gap-2 text-black/70 hover:text-black">
      <span aria-hidden className={`grid h-4 w-4 place-items-center border text-[10px] ${checkbox ? "" : "rounded-full"} ${active ? "border-foreground bg-foreground text-white" : "border-black/25"}`}>
        {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <span className={active ? "font-medium text-black" : ""}>{label}</span>
      <span className="ml-auto text-black/35">({count})</span>
    </Link>
  );
}
