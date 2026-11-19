import type { Metadata } from "next";

export const metadata: Metadata = { title: "Panier" };

export default function CartPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <h1 className="text-3xl font-bold">Panier</h1>
      {/* TODO : panier (localStorage), puis commande + paiement MVola / Orange Money / Airtel Money / crédits boutique */}
      <p className="text-black/70">Votre panier est vide.</p>
    </div>
  );
}
