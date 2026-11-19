"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { placeOrder, type OrderFormState } from "@/lib/actions/order";
import { cart, useCart } from "@/lib/cart-store";
import { formatAriary } from "@/lib/format";
import { CATEGORY_STYLE } from "@/lib/labels";

type CartProduct = { slug: string; name: string; price: number; stock: number; category: keyof typeof CATEGORY_STYLE; image: string | null };
type Account = { name: string; creditBalance: number } | null;

const PAYMENTS = [
  { value: "MVOLA", label: "MVola" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "AIRTEL_MONEY", label: "Airtel Money" },
  { value: "ESPECES", label: "Espèces à la livraison / au retrait" },
];

export function CartView({ account }: { account: Account }) {
  const lines = useCart();
  const [products, setProducts] = useState<Record<string, CartProduct> | null>(null);
  const slugsKey = lines.map((l) => l.slug).sort().join(",");

  // Prix et stock relus sur le serveur à chaque changement de contenu du panier.
  useEffect(() => {
    if (!slugsKey) return;
    let cancelled = false;
    fetch(`/api/panier?slugs=${encodeURIComponent(slugsKey)}`)
      .then((r) => r.json() as Promise<CartProduct[]>)
      .then((list) => !cancelled && setProducts(Object.fromEntries(list.map((p) => [p.slug, p]))))
      .catch(() => !cancelled && setProducts({}));
    return () => {
      cancelled = true;
    };
  }, [slugsKey]);

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-surface p-12 text-center">
        <ShoppingBag aria-hidden className="h-12 w-12 text-black/25" strokeWidth={1.3} />
        <p className="text-lg font-semibold">Votre panier est vide</p>
        <Link href="/boutique" className="rounded-full bg-foreground px-5 py-3 font-semibold text-white hover:bg-brand">Découvrir la boutique</Link>
      </div>
    );
  }
  if (!products) return <div className="h-64 animate-pulse rounded-3xl bg-surface" />;

  const rows = lines.map((l) => ({ line: l, product: products[l.slug] }));
  const valid = rows.filter((r) => r.product && r.product.stock > 0);
  const subtotal = valid.reduce((s, r) => s + r.product.price * Math.min(r.line.qty, r.product.stock), 0);
  const problems = rows.some((r) => !r.product || r.line.qty > r.product.stock);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <ul className="flex flex-col divide-y divide-black/10 rounded-3xl bg-surface px-5">
        {rows.map(({ line, product }) => (
          <li key={line.slug} className="flex gap-4 py-5">
            <div className={`grid h-24 w-24 shrink-0 place-items-center rounded-sm bg-[#efefed] text-black/25`}>
              {product ? (() => { const Icon = CATEGORY_STYLE[product.category].Icon; return <Icon className="h-9 w-9" strokeWidth={1.2} />; })() : null}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex justify-between gap-3">
                {product ? (
                  <Link href={`/boutique/${line.slug}`} className="font-medium hover:underline">{product.name}</Link>
                ) : (
                  <span className="font-medium text-black/50">Produit indisponible</span>
                )}
                <button type="button" onClick={() => cart.remove(line.slug)} aria-label="Retirer du panier" className="text-black/40 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {product && (
                <>
                  <p className="text-sm text-black/60">{formatAriary(product.price)} l&apos;unité</p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center rounded-full border border-black/15">
                      <button type="button" aria-label="Moins" onClick={() => cart.setQty(line.slug, line.qty - 1)} className="grid h-9 w-9 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-7 text-center text-sm font-semibold">{line.qty}</span>
                      <button type="button" aria-label="Plus" disabled={line.qty >= product.stock} onClick={() => cart.setQty(line.slug, line.qty + 1)} className="grid h-9 w-9 place-items-center disabled:opacity-30"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="font-semibold">{formatAriary(product.price * line.qty)}</p>
                  </div>
                  {line.qty > product.stock && (
                    <p className="text-sm text-red-600">
                      {product.stock === 0 ? "Épuisé entre-temps." : `Plus que ${product.stock} en stock.`}{" "}
                      <button type="button" className="underline" onClick={() => cart.setQty(line.slug, product.stock)}>Ajuster</button>
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Checkout account={account} subtotal={subtotal} blocked={problems} lines={lines} />
    </div>
  );
}

function Checkout({ account, subtotal, blocked, lines }: { account: Account; subtotal: number; blocked: boolean; lines: { slug: string; qty: number }[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<OrderFormState, FormData>(placeOrder, {});
  const [f, setF] = useState({ customerName: account?.name ?? "", customerPhone: "", delivery: "LIVRAISON", deliveryAddress: "", paymentMethod: "MVOLA", useCredits: false });
  const err = state.fieldErrors ?? {};
  const credits = f.useCredits && account ? Math.min(account.creditBalance, subtotal) : 0;

  useEffect(() => {
    if (state.orderId) {
      cart.clear();
      router.push(`/compte/commandes/${state.orderId}?nouvelle=1`);
    }
  }, [state.orderId, router]);

  const input = "w-full rounded-xl border border-black/10 bg-background p-3 focus:border-brand focus:outline-none";
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((v) => ({ ...v, [k]: e.target.value }));

  return (
    <aside className="flex h-fit flex-col gap-5 rounded-3xl bg-surface p-6 lg:sticky lg:top-24">
      <h2 className="text-xl font-extrabold">Récapitulatif</h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatAriary(subtotal)}</dd></div>
        {credits > 0 && <div className="flex justify-between text-brand"><dt>Crédits boutique</dt><dd>− {formatAriary(credits)}</dd></div>}
        {/* À valider par HOPE Services : tarif de livraison */}
        {f.delivery === "LIVRAISON" && <div className="flex justify-between text-black/60"><dt>Livraison</dt><dd>confirmée par téléphone</dd></div>}
        <div className="flex justify-between border-t border-black/10 pt-3 text-lg font-bold"><dt>À payer</dt><dd>{formatAriary(subtotal - credits)}</dd></div>
      </dl>

      {!account ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-black/70">Connectez-vous pour commander : vous suivrez votre commande et utiliserez vos crédits boutique.</p>
          <Link href="/connexion?callbackUrl=%2Fpanier" className="rounded-full bg-brand px-5 py-3.5 text-center font-semibold text-white hover:bg-brand-dark">Se connecter pour commander</Link>
        </div>
      ) : (
        <form
          action={(fd) => {
            fd.set("items", JSON.stringify(lines));
            return action(fd);
          }}
          className="flex flex-col gap-4"
        >
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nom
            <input name="customerName" value={f.customerName} onChange={set("customerName")} required autoComplete="name" className={input} />
            {err.customerName && <span className="font-normal text-red-600">{err.customerName}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Téléphone
            <input name="customerPhone" value={f.customerPhone} onChange={set("customerPhone")} required type="tel" inputMode="tel" placeholder="034 12 345 67" className={input} />
            {err.customerPhone && <span className="font-normal text-red-600">{err.customerPhone}</span>}
          </label>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1 font-semibold">Réception</legend>
            {[
              { v: "LIVRAISON", l: "Livraison à Antananarivo" },
              { v: "RETRAIT", l: "Retrait chez HOPE Services (Andoharanofotsy)" },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-2">
                <input type="radio" name="delivery" value={o.v} checked={f.delivery === o.v} onChange={set("delivery")} /> {o.l}
              </label>
            ))}
          </fieldset>
          {f.delivery === "LIVRAISON" && (
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Adresse de livraison
              <input name="deliveryAddress" value={f.deliveryAddress} onChange={set("deliveryAddress")} required placeholder="Quartier, lot, repère" className={input} />
              {err.deliveryAddress && <span className="font-normal text-red-600">{err.deliveryAddress}</span>}
            </label>
          )}
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Paiement
            <select name="paymentMethod" value={f.paymentMethod} onChange={set("paymentMethod")} className={input}>
              {PAYMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          {account.creditBalance > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="useCredits" checked={f.useCredits} onChange={(e) => setF((v) => ({ ...v, useCredits: e.target.checked }))} />
              Utiliser mes crédits boutique ({formatAriary(account.creditBalance)})
            </label>
          )}
          <p className="text-xs text-black/60">Nous vous appelons pour confirmer la commande et les modalités de paiement.</p>
          {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          <button disabled={pending || blocked || subtotal === 0} className="rounded-full bg-foreground px-5 py-3.5 font-semibold text-white hover:bg-brand disabled:opacity-40">
            {pending ? "Envoi…" : "Valider la commande"}
          </button>
          {blocked && <p className="text-sm text-red-600">Ajustez les articles signalés avant de commander.</p>}
        </form>
      )}
    </aside>
  );
}
