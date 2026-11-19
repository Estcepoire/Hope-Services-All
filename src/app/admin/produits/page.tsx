import { CircleCheck, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FieldFilter, ListToolbar, Pagination, SelectFilter } from "@/components/admin/list-toolbar";
import { Badge, Card, PageTitle, Table } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { intParam, oneOf, pageParams, str } from "@/lib/admin/list-params";
import { deleteProduct } from "@/lib/actions/admin/products";
import { formatAriary } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const CATEGORIES = Object.keys(CATEGORY_LABELS) as (keyof typeof CATEGORY_LABELS)[];
const OK_MESSAGES: Record<string, string> = {
  cree: "Produit créé.",
  modifie: "Produit modifié.",
  supprime: "Produit supprimé.",
  depublie: "Ce produit a déjà été commandé : il est conservé pour l'historique et retiré de la boutique.",
};
const LOW_STOCK = 5;

export default function ProductsAdminPage(props: PageProps<"/admin/produits">) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Produits" crumbs={["Produits"]} />
        <Link href="/admin/produits/nouveau" className="flex h-10 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" /> Nouveau produit
        </Link>
      </div>
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Products {...props} />
        </Suspense>
      </Card>
    </>
  );
}

async function Products({ searchParams }: PageProps<"/admin/produits">) {
  await requireRole(["admin"], "/admin/produits");
  const sp = await searchParams;
  const q = str(sp, "q");
  const categorie = oneOf(sp, "categorie", CATEGORIES);
  const visibilite = oneOf(sp, "visibilite", ["publie", "masque"] as const);
  const stock = oneOf(sp, "stock", ["epuise", "faible"] as const);
  const min = intParam(sp, "min");
  const max = intParam(sp, "max");
  const ok = str(sp, "ok");
  const { page, skip, take } = pageParams(sp);

  const where: Prisma.ProductWhereInput = {
    ...(categorie && { category: categorie }),
    ...(visibilite && { published: visibilite === "publie" }),
    ...(stock === "epuise" && { stock: 0 }),
    ...(stock === "faible" && { stock: { gt: 0, lte: LOW_STOCK } }),
    ...((min !== undefined || max !== undefined) && { price: { ...(min !== undefined && { gte: min }), ...(max !== undefined && { lte: max }) } }),
    ...(q && { OR: [{ name: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] }),
  };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { _count: { select: { orderItems: true } } } }),
  ]);

  return (
    <>
      {ok && OK_MESSAGES[ok] && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded bg-brand-light p-3 text-sm text-brand-dark"><CircleCheck className="h-4 w-4" /> {OK_MESSAGES[ok]}</p>
      )}
      <ListToolbar
        basePath="/admin/produits"
        sp={{ ...sp, ok: undefined }}
        placeholder="Nom ou description…"
        filters={
          <>
            <SelectFilter name="categorie" label="Catégorie" value={categorie} options={CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))} />
            <SelectFilter name="visibilite" label="Visibilité" value={visibilite} options={[{ value: "publie", label: "En boutique" }, { value: "masque", label: "Masqués" }]} />
          </>
        }
        advanced={
          <>
            <SelectFilter name="stock" label="Stock" value={stock} options={[{ value: "epuise", label: "Épuisé" }, { value: "faible", label: `Faible (≤ ${LOW_STOCK})` }]} />
            <FieldFilter name="min" label="Prix min (Ar)" type="number" value={str(sp, "min")} />
            <FieldFilter name="max" label="Prix max (Ar)" type="number" value={str(sp, "max")} />
          </>
        }
      />
      {products.length === 0 ? (
        <p className="py-6 text-center text-[#8a978c]">Aucun produit ne correspond.</p>
      ) : (
        <Table head={["Produit", "Catégorie", "Prix", "Stock", "Boutique", "Actions"]}>
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-[#fafcf9]">
              <td>
                <span className="flex items-center gap-3">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element -- vignette admin
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <span aria-hidden className="h-10 w-10 rounded bg-[#efefed]" />
                  )}
                  <Link href={`/admin/produits/${p.id}`} className="font-semibold text-brand-dark hover:text-brand">{p.name}</Link>
                </span>
              </td>
              <td>{CATEGORY_LABELS[p.category]}</td>
              <td>{formatAriary(p.price)}</td>
              <td className={p.stock === 0 ? "font-semibold text-red-600" : p.stock <= LOW_STOCK ? "font-semibold text-amber-700" : ""}>{p.stock}</td>
              <td>{p.published ? <Badge className="bg-green-100 text-green-800">Visible</Badge> : <Badge className="bg-black/5 text-black/60">Masqué</Badge>}</td>
              <td className="text-right">
                <span className="inline-flex items-center gap-2">
                  <Link href={`/admin/produits/${p.id}`} aria-label={`Modifier ${p.name}`} className="grid h-8 w-8 place-items-center rounded border border-[#e6ece3] hover:border-brand hover:text-brand">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton
                      message={p._count.orderItems ? `« ${p.name} » a déjà été commandé : il sera retiré de la boutique mais conservé. Continuer ?` : `Supprimer définitivement « ${p.name} » ?`}
                      className="h-8 rounded border border-red-200 px-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      {p._count.orderItems ? "Retirer" : "Supprimer"}
                    </ConfirmButton>
                  </form>
                </span>
              </td>
            </tr>
          ))}
        </Table>
      )}
      <Pagination basePath="/admin/produits" sp={{ ...sp, ok: undefined }} page={page} total={total} />
    </>
  );
}
