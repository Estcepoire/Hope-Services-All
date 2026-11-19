import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatAriary } from "@/lib/format";

export default function CollectionsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Collectes</h1>
      {/* TODO : assigner un collecteur, planifier, carte de chaleur des déclarations */}
      <Suspense fallback={<p>Chargement…</p>}>
        <DeclarationsTable />
      </Suspense>
    </div>
  );
}

async function DeclarationsTable() {
  await requireRole(["admin"], "/admin/collectes");
  const declarations = await prisma.wasteDeclaration.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { declarant: { select: { name: true } }, collectionPoint: { select: { name: true } } },
  });

  if (declarations.length === 0) return <p className="text-black/60">Aucune déclaration pour le moment.</p>;

  return (
    <table className="w-full text-left text-sm">
      <thead className="border-b border-black/10 text-black/60">
        <tr><th className="py-2">Date</th><th>Déclarant</th><th>Mode</th><th>Lieu</th><th>Statut</th><th className="text-right">Estimation</th></tr>
      </thead>
      <tbody>
        {declarations.map((d) => (
          <tr key={d.id} className="border-b border-black/5">
            <td className="py-2">{d.createdAt.toLocaleDateString("fr-FR")}</td>
            <td>{d.declarant.name}</td>
            <td>{d.mode === "APPORT" ? "Apport" : "Enlèvement"}</td>
            <td>{d.collectionPoint?.name ?? d.address ?? "-"}</td>
            <td>{d.status}</td>
            <td className="text-right">{formatAriary(d.estimatedValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
