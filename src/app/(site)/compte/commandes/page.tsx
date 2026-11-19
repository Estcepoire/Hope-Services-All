import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { formatAriary } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mes commandes", robots: { index: false } };

export default function MyOrdersPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">Mes commandes</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const session = await requireRole([...APP_ROLES], "/compte/commandes");
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });
  if (orders.length === 0) {
    return <p className="text-black/60">Aucune commande pour le moment. <Link href="/boutique" className="text-brand underline">Voir la boutique</Link></p>;
  }
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/compte/commandes/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4 hover:ring-1 hover:ring-brand">
            <div>
              <p className="font-semibold">Commande n° {o.id.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-black/60">{o.createdAt.toLocaleDateString("fr-FR")} · {o._count.items} article{o._count.items > 1 ? "s" : ""}</p>
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ORDER_STATUS_COLORS[o.status]}`}>{ORDER_STATUS_LABELS[o.status]}</span>
              <p className="mt-1 font-semibold">{formatAriary(o.total)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
