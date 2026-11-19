import { Banknote, Mail, ReceiptText, Truck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, KpiCard, PageTitle, Table } from "@/components/admin/ui";
import { formatAriary } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const DAYS = 14;

export default function AdminDashboard() {
  return (
    <>
      <PageTitle title="Tableau de bord" />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-md bg-white" />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  await requireRole(["admin"], "/admin");
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS - 1));

  const [pendingPickups, ordersToHandle, revenue, unreadMessages, payments, items, recentOrders, recentMessages] = await Promise.all([
    prisma.wasteDeclaration.count({ where: { status: "EN_ATTENTE" } }),
    prisma.order.count({ where: { status: { in: ["EN_ATTENTE_PAIEMENT", "PAYEE"] } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "REUSSI" } }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.payment.findMany({ where: { status: "REUSSI", createdAt: { gte: since } }, select: { amount: true, createdAt: true } }),
    prisma.wasteItem.groupBy({
      by: ["materialId"],
      _sum: { estimatedKg: true },
      where: { declaration: { status: { not: "ANNULEE" } } },
      orderBy: { _sum: { estimatedKg: "desc" } },
      take: 6,
    }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, customerName: true, total: true, status: true, createdAt: true } }),
    prisma.contactMessage.findMany({ where: { handled: false }, orderBy: { createdAt: "desc" }, take: 4, select: { id: true, name: true, message: true, createdAt: true } }),
  ]);

  const materials = await prisma.material.findMany({ where: { id: { in: items.map((i) => i.materialId) } }, select: { id: true, name: true } });
  const materialName = new Map(materials.map((m) => [m.id, m.name]));

  // Ventes encaissées par jour (14 derniers jours)
  const byDay = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    return { key: d.toDateString(), label: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), total: 0 };
  });
  for (const p of payments) {
    const day = byDay.find((d) => d.key === p.createdAt.toDateString());
    if (day) day.total += p.amount;
  }
  const maxDay = Math.max(1, ...byDay.map((d) => d.total));
  const maxKg = Math.max(1, ...items.map((i) => i._sum.estimatedKg ?? 0));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Enlèvements à planifier" value={String(pendingPickups)} Icon={Truck} tone="green" href="/admin/collectes" />
        <KpiCard label="Commandes à traiter" value={String(ordersToHandle)} Icon={ReceiptText} tone="lime" href="/admin/commandes" />
        <KpiCard label="Ventes encaissées" value={formatAriary(revenue._sum.amount ?? 0)} hint="depuis l'ouverture" Icon={Banknote} tone="yellow" />
        <KpiCard label="Messages non traités" value={String(unreadMessages)} Icon={Mail} tone="dark" href="/admin/messages" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Ventes encaissées" subtitle={`${DAYS} derniers jours`}>
          <div role="img" aria-label="Histogramme des ventes encaissées par jour" className="flex h-56 items-end gap-1.5 border-b border-[#e6ece3] pb-1">
            {byDay.map((d) => (
              <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className="rounded-t bg-gradient-to-t from-brand to-accent transition group-hover:opacity-80"
                  style={{ height: `${Math.max(d.total ? 4 : 1, (d.total / maxDay) * 100)}%`, opacity: d.total ? 1 : 0.15 }}
                />
                <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-xs text-white group-hover:block">
                  {d.label} : {formatAriary(d.total)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-[#8a978c]">
            <span>{byDay[0].label}</span>
            <span>{byDay[DAYS - 1].label}</span>
          </div>
        </Card>

        <Card title="Déchets déclarés" subtitle="par matériau">
          {items.length === 0 ? (
            <p className="text-sm text-[#8a978c]">Aucune collecte pour le moment.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((i) => (
                <li key={i.materialId} className="text-sm">
                  <div className="mb-1 flex justify-between">
                    <span>{materialName.get(i.materialId)}</span>
                    <span className="font-semibold text-brand-dark">{Math.round(i._sum.estimatedKg ?? 0)} kg</span>
                  </div>
                  <div className="h-2 rounded-full bg-brand-light">
                    <div className="h-2 rounded-full bg-brand" style={{ width: `${((i._sum.estimatedKg ?? 0) / maxKg) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card title="Dernières commandes">
          {recentOrders.length === 0 ? (
            <p className="text-sm text-[#8a978c]">Aucune commande pour le moment.</p>
          ) : (
            <Table head={["N°", "Client", "Date", "Statut", "Montant"]}>
              {recentOrders.map((o) => (
                <tr key={o.id}>
                  <td><Link href="/admin/commandes" className="font-semibold text-brand">#{o.id.slice(-6).toUpperCase()}</Link></td>
                  <td>{o.customerName}</td>
                  <td>{o.createdAt.toLocaleDateString("fr-FR")}</td>
                  <td><Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td>
                  <td className="text-right font-semibold">{formatAriary(o.total)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Messages" subtitle="à traiter">
          {recentMessages.length === 0 ? (
            <p className="text-sm text-[#8a978c]">Aucun message en attente.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {recentMessages.map((m) => (
                <li key={m.id} className="border-l-2 border-brand pl-3 text-sm">
                  <p className="font-semibold text-brand-dark">{m.name}</p>
                  <p className="line-clamp-2 text-[#5b6b5e]">{m.message}</p>
                  <p className="text-xs text-[#8a978c]">{m.createdAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/messages" className="mt-4 inline-block text-sm font-semibold text-brand">Tous les messages →</Link>
        </Card>
      </div>
    </div>
  );
}
