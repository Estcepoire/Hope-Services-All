"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartCount } from "@/lib/cart-store";

export function CartButton() {
  const count = useCartCount();
  return (
    <Link
      href="/panier"
      aria-label={count ? `Panier, ${count} article${count > 1 ? "s" : ""}` : "Panier"}
      className="relative grid h-10 w-10 place-items-center rounded-full border border-black/15 hover:border-brand"
    >
      <ShoppingBag className="h-[18px] w-[18px]" />
      {count > 0 && (
        <span aria-hidden className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
