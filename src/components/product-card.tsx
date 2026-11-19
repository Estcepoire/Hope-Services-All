import Image from "next/image";
import Link from "next/link";
import { formatAriary } from "@/lib/format";
import { CATEGORY_LABELS, CATEGORY_STYLE } from "@/lib/labels";
import { Recycle } from "lucide-react";

export type ProductCardData = {
  slug: string;
  name: string;
  price: number;
  images: string[];
  recycledKg: number | null;
  stock: number;
  category: keyof typeof CATEGORY_STYLE;
};

// Carte produit inspirée du thème Minimalista (ecomm.design) : visuel carré sur fond gris clair,
// angles presque droits, petite catégorie en capitales au-dessus, badges noirs, texte sobre.
export function ProductCard({ product }: { product: ProductCardData }) {
  const image = product.images[0];
  const style = CATEGORY_STYLE[product.category];
  return (
    <Link href={`/boutique/${product.slug}`} className="group flex flex-col gap-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-black/45">
        HOPE · {CATEGORY_LABELS[product.category]}
      </p>
      <div className="relative aspect-square overflow-hidden rounded-sm bg-[#efefed]">
        {image ? (
          <Image src={image} alt={product.name} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
        ) : (
          // En attendant les photos : illustration de la catégorie
          <div aria-hidden className="grid h-full place-items-center text-black/20 transition duration-500 group-hover:scale-110"><style.Icon className="h-16 w-16" strokeWidth={1.1} /></div>
        )}
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          {product.stock === 0 && <span className="bg-foreground px-2 py-0.5 text-[11px] font-medium text-white">Épuisé</span>}
          {product.recycledKg ? <span className="flex items-center gap-1 bg-white px-2 py-0.5 text-[11px] font-medium"><Recycle className="h-3 w-3" /> {product.recycledKg} kg</span> : null}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 text-sm">
        <h3 className="font-sans font-normal tracking-normal group-hover:underline">{product.name}</h3>
        <p className="text-black/60">{formatAriary(product.price)}</p>
      </div>
    </Link>
  );
}
