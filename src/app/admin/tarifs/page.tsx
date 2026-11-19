import { Suspense } from "react";
import { Card, PageTitle } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatAriary } from "@/lib/format";

export default function PricesPage() {
  return (
    <>
      <PageTitle title="Grille tarifaire" crumbs={["Grille tarifaire"]} />
      {/* TODO : édition des prix via server action + revalidateTag("materials") */}
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
        <PricesTable />
      </Suspense>
      </Card>
    </>
  );
}

async function PricesTable() {
  await requireRole(["admin"], "/admin/tarifs");
  const materials = await prisma.material.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });

  return (
    <table className="w-full max-w-3xl text-left text-sm">
      <thead className="border-b-2 border-[#e6ece3] text-brand-dark">
        <tr><th className="py-2">Code</th><th>Matériau</th><th>Catégorie</th><th className="text-right">Prix / kg</th></tr>
      </thead>
      <tbody>
        {materials.map((m) => (
          <tr key={m.id} className="border-b border-[#e6ece3]">
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
