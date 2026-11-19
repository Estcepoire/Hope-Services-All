import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatAriary } from "@/lib/format";

export default function PricesPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Grille tarifaire</h1>
      {/* TODO : édition des prix via server action + revalidateTag("materials") */}
      <Suspense fallback={<p>Chargement…</p>}>
        <PricesTable />
      </Suspense>
    </div>
  );
}

async function PricesTable() {
  await requireRole(["admin"], "/admin/tarifs");
  const materials = await prisma.material.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return (
    <table className="w-full max-w-3xl text-left text-sm">
      <thead className="border-b border-black/10 text-black/60">
        <tr><th className="py-2">Code</th><th>Matériau</th><th>Catégorie</th><th className="text-right">Prix / kg</th></tr>
      </thead>
      <tbody>
        {materials.map((m) => (
          <tr key={m.id} className="border-b border-black/5">
            <td className="py-2 font-mono">{m.code}</td>
            <td>{m.name}</td>
            <td>{m.category}</td>
            <td className="text-right">{formatAriary(m.pricePerKg)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
