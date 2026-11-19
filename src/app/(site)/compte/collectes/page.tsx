import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { formatAriary } from "@/lib/format";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Mes collectes", robots: { index: false } };

export default function MyCollectionsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Mes collectes</h1>
        <Link href="/collecte/declarer" className="rounded-full bg-brand px-4 py-2 text-white hover:bg-brand-dark">
          Nouvelle demande
        </Link>
      </div>
      <Suspense fallback={<p>Chargement…</p>}>
        <List />
      </Suspense>
    </div>
  );
}

async function List() {
  const session = await requireRole([...APP_ROLES], "/compte/collectes");
  const declarations = await prisma.wasteDeclaration.findMany({
    where: { declarantId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { material: { select: { name: true } } } } },
  });

  if (declarations.length === 0) return <p className="text-black/60">Aucune demande pour le moment.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {declarations.map((d) => (
        <li key={d.id}>
          <Link href={`/compte/collectes/${d.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 p-4 hover:border-brand">
            <div>
              <p className="font-medium">{d.items.map((i) => `${i.material.name} ~${i.estimatedKg} kg`).join(" · ")}</p>
              <p className="text-sm text-black/60">Demande du {d.createdAt.toLocaleDateString("fr-FR")}</p>
            </div>
            <div className="text-right">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
              <p className="mt-1 font-semibold">{formatAriary(d.finalValue ?? d.estimatedValue)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
