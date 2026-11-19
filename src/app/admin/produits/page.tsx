import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { formatAriary } from "@/lib/format";

export default function ProductsAdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Produits</h1>
      {/* TODO : création / édition, upload des photos, liaison aux lots de matière */}
      <Suspense fallback={<p>Chargement…</p>}>
        <ProductsTable />
      </Suspense>
    </div>
  );
}

async function ProductsTable() {
  await requireRole(["admin"], "/admin/produits");
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <table className="w-full max-w-3xl text-left text-sm">
      <thead className="border-b border-black/10 text-black/60">
        <tr><th className="py-2">Produit</th><th>Stock</th><th>Publié</th><th className="text-right">Prix</th></tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id} className="border-b border-black/5">
            <td className="py-2">{p.name}</td>
            <td>{p.stock}</td>
            <td>{p.published ? "Oui" : "Non"}</td>
            <td className="text-right">{formatAriary(p.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
