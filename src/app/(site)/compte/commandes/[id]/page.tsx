import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { formatAriary } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYOUT_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Ma commande", robots: { index: false } };

export default function OrderPage(props: PageProps<"/compte/commandes/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface" />}>
      <Details {...props} />
    </Suspense>
  );
}

async function Details({ params, searchParams }: PageProps<"/compte/commandes/[id]">) {
  const { id } = await params;
  const { nouvelle } = await searchParams;
  const session = await requireRole([...APP_ROLES], `/compte/commandes/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { name: true, slug: true } } } }, payments: true },
  });
  // Même réponse pour « inexistante » et « appartient à quelqu'un d'autre ».
  if (!order || order.userId !== session.user.id) notFound();
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const payment = order.payments[0];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {nouvelle && (
        <div role="status" className="flex items-start gap-3 rounded-2xl bg-brand-light p-5 text-brand-dark">
          <CircleCheck aria-hidden className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="font-semibold">Merci, votre commande est enregistrée !</p>
            <p className="text-sm">Nous vous appelons au {order.customerPhone} pour confirmer la livraison et le paiement.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/compte/commandes" className="text-sm text-black/50 hover:text-brand">← Mes commandes</Link>
          <h1 className="mt-1 text-3xl font-extrabold">Commande n° {order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-sm text-black/50">{order.createdAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>{ORDER_STATUS_LABELS[order.status]}</span>
      </div>

      <div className="rounded-3xl bg-surface p-5">
        <ul className="divide-y divide-black/5">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-sm">
              <Link href={`/boutique/${i.product.slug}`} className="hover:underline">{i.quantity} × {i.product.name}</Link>
              <span className="font-medium">{formatAriary(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 flex flex-col gap-1 border-t border-black/10 pt-3 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatAriary(subtotal)}</dd></div>
          {order.creditsUsed > 0 && <div className="flex justify-between text-brand"><dt>Crédits boutique</dt><dd>− {formatAriary(order.creditsUsed)}</dd></div>}
          <div className="flex justify-between text-lg font-bold"><dt>À payer</dt><dd>{formatAriary(order.total)}</dd></div>
        </dl>
      </div>

      <dl className="grid gap-4 rounded-3xl bg-surface p-5 text-sm sm:grid-cols-2">
        <div><dt className="text-black/50">Réception</dt><dd className="font-medium">{order.deliveryAddress ? `Livraison : ${order.deliveryAddress}` : "Retrait chez HOPE Services"}</dd></div>
        <div><dt className="text-black/50">Paiement</dt><dd className="font-medium">{payment ? `${PAYOUT_LABELS[payment.method]} · ${payment.status === "REUSSI" ? "reçu" : "à confirmer"}` : "Réglé en crédits boutique"}</dd></div>
      </dl>
    </div>
  );
}
