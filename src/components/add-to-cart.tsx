"use client";

import { Check, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cart, useCart } from "@/lib/cart-store";

export function AddToCart({ slug, stock }: { slug: string; stock: number }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = useCart().find((l) => l.slug === slug)?.qty ?? 0;
  const max = Math.max(0, stock - inCart);

  if (stock === 0) {
    return <button disabled className="rounded-full bg-black/10 px-6 py-3.5 font-semibold text-black/40">Épuisé</button>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-black/15 bg-surface">
          <button type="button" aria-label="Moins" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-12 w-12 place-items-center disabled:opacity-30" disabled={qty <= 1}>
            <Minus className="h-4 w-4" />
          </button>
          <span aria-live="polite" className="w-8 text-center font-semibold">{qty}</span>
          <button type="button" aria-label="Plus" onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid h-12 w-12 place-items-center disabled:opacity-30" disabled={qty >= max}>
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          disabled={max === 0}
          onClick={() => {
            cart.add(slug, Math.min(qty, max));
            setQty(1);
            setAdded(true);
            setTimeout(() => setAdded(false), 2500);
          }}
          className="flex items-center gap-2 rounded-full bg-foreground px-6 py-3.5 font-semibold text-white hover:bg-brand disabled:opacity-40"
        >
          {added ? <><Check className="h-4 w-4" /> Ajouté</> : "Ajouter au panier"}
        </button>
      </div>
      {inCart > 0 && (
        <p className="text-sm text-black/60">
          {inCart} dans votre panier · <Link href="/panier" className="font-semibold text-brand underline">Voir le panier</Link>
          {max === 0 && " · stock maximum atteint"}
        </p>
      )}
    </div>
  );
}
