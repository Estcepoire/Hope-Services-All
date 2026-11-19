import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatAriary } from "@/lib/format";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <Kpis />
      </Suspense>
    </div>
  );
}

async function Kpis() {
  await requireRole(["admin"], "/admin");
  const [pending, planned, orders, revenue] = await Promise.all([
    prisma.wasteDeclaration.count({ where: { status: "EN_ATTENTE" } }),
    prisma.wasteDeclaration.count({ where: { status: "PLANIFIEE" } }),
    prisma.order.count({ where: { status: { not: "ANNULEE" } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "REUSSI" } }),
  ]);

  const kpis = [
    { label: "Demandes en attente", value: pending },
    { label: "Enlèvements planifiés", value: planned },
    { label: "Commandes", value: orders },
    { label: "Ventes encaissées", value: formatAriary(revenue._sum.amount ?? 0) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-xl border border-black/10 p-4">
          <p className="text-sm text-black/60">{k.label}</p>
          <p className="text-2xl font-bold">{k.value}</p>
        </div>
      ))}
    </div>
  );
}
