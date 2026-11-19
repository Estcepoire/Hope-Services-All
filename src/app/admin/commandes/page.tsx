import { revalidatePath, updateTag } from "next/cache";
import { Suspense } from "react";
import { Card, PageTitle } from "@/components/admin/ui";
import type { OrderStatus } from "@/generated/prisma/enums";
import { formatAriary } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYOUT_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// Transitions autorisées : vérifiées sur le serveur, quelle que soit la requête reçue.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  EN_ATTENTE_PAIEMENT: ["PAYEE", "ANNULEE"],
  PAYEE: ["EXPEDIEE", "ANNULEE"],
  EXPEDIEE: ["LIVREE"],
  LIVREE: [],
  ANNULEE: [],
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  PAYEE: "Paiement reçu",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annuler",
};

async function changeStatus(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/commandes");
  const id = String(formData.get("id"));
  const to = String(formData.get("to")) as OrderStatus;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || !NEXT[order.status].includes(to)) throw new Error("Transition de statut non autorisée");

    // Mise à jour conditionnelle : deux clics simultanés ne peuvent pas appliquer deux fois la transition.
    const { count } = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: to } });
    if (count === 0) throw new Error("La commande a changé entre-temps");

    if (to === "PAYEE") {
      await tx.payment.updateMany({ where: { orderId: id, status: "EN_ATTENTE" }, data: { status: "REUSSI" } });
    }
    if (to === "ANNULEE") {
      // Remise en stock et remboursement des crédits utilisés.
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      if (order.creditsUsed > 0 && order.userId) {
        await tx.user.update({ where: { id: order.userId }, data: { creditBalance: { increment: order.creditsUsed } } });
      }
      await tx.payment.updateMany({ where: { orderId: id, status: "REUSSI" }, data: { status: "REMBOURSE" } });
      await tx.payment.updateMany({ where: { orderId: id, status: "EN_ATTENTE" }, data: { status: "ECHOUE" } });
    }
  });

  updateTag("products");
  revalidatePath("/admin/commandes");
}

export default function OrdersAdminPage() {
  return (
    <>
      <PageTitle title="Commandes" crumbs={["Commandes"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
        <Orders />
      </Suspense>
      </Card>
    </>
  );
}

async function Orders() {
  await requireRole(["admin"], "/admin/commandes");
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { items: { include: { product: { select: { name: true } } } }, payments: true },
  });
  if (orders.length === 0) return <p className="text-black/60">Aucune commande pour le moment.</p>;

  return (
    <ul className="flex max-w-4xl flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id} className="flex flex-col gap-3 rounded-md border border-[#e6ece3] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              <strong>n° {o.id.slice(-6).toUpperCase()}</strong> · {o.customerName} · {o.customerPhone}
            </p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
          </div>
          <p className="text-sm text-black/70">{o.items.map((i) => `${i.quantity} × ${i.product.name}`).join(" · ")}</p>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span>
              {o.deliveryAddress ? `Livraison : ${o.deliveryAddress}` : "Retrait"} · {o.payments[0] ? PAYOUT_LABELS[o.payments[0].method] : "Crédits"} ·{" "}
              <strong>{formatAriary(o.total)}</strong>
              {o.creditsUsed > 0 && ` (+ ${formatAriary(o.creditsUsed)} de crédits)`}
            </span>
            <div className="flex gap-2">
              {NEXT[o.status].map((to) => (
                <form key={to} action={changeStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="to" value={to} />
                  <button className={`rounded-full px-3 py-1 font-medium ${to === "ANNULEE" ? "border border-red-300 text-red-700" : "bg-foreground text-white"}`}>
                    {ACTION_LABELS[to]}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
