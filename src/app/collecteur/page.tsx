import type { Metadata } from "next";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Espace collecteur" };

// Interface mobile des collecteurs. À terme : PWA hors connexion, itinéraire, pesée et validation.
// Accès : rôles collecteur ou admin (vérifié dans Pickups, au plus près des données).

export default function CollectorPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <h1 className="text-xl font-bold text-brand">Mes enlèvements</h1>
      <Suspense fallback={<p>Chargement…</p>}>
        <Pickups />
      </Suspense>
    </main>
  );
}

async function Pickups() {
  await requireRole(["collecteur", "admin"], "/collecteur");
  const pickups = await prisma.wasteDeclaration.findMany({
    where: { mode: "ENLEVEMENT", status: "PLANIFIEE" },
    orderBy: { scheduledAt: "asc" },
    include: { declarant: { select: { name: true, phone: true } }, items: { include: { material: true } } },
  });

  if (pickups.length === 0) return <p className="text-black/60">Aucun enlèvement planifié.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {pickups.map((p) => (
        <li key={p.id} className="rounded-xl border border-black/10 p-4">
          <p className="font-semibold">{p.declarant.name}</p>
          <p className="text-sm text-black/70">{p.address}</p>
          <p className="text-sm">{p.items.map((i) => `${i.material.name} ~${i.estimatedKg} kg`).join(" · ")}</p>
          {p.lat != null && p.lng != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-brand"
            >
              Itinéraire →
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
