import { CircleCheck, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ListToolbar, Pagination, SelectFilter, SortableTable } from "@/components/admin/list-toolbar";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import { oneOf, pageParams, sortParams, str, type SortDir } from "@/lib/admin/list-params";
import { deletePoint } from "@/lib/actions/admin/points";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const OK_MESSAGES: Record<string, string> = {
  cree: "Point d'apport créé.",
  modifie: "Point d'apport modifié.",
  supprime: "Point d'apport supprimé.",
  desactive: "Des apports y sont rattachés : le point est conservé pour l'historique et retiré de la carte.",
};

const SORTS = {
  nom: (dir: SortDir) => ({ name: dir }),
  adresse: (dir: SortDir) => ({ address: dir }),
  horaires: (dir: SortDir) => ({ openingHours: { sort: dir, nulls: "last" as const } }),
  materiaux: (dir: SortDir) => ({ acceptedMaterials: { _count: dir } }),
  apports: (dir: SortDir) => ({ declarations: { _count: dir } }),
  etat: (dir: SortDir) => ({ active: dir }),
} satisfies Record<string, (dir: SortDir) => Prisma.CollectionPointOrderByWithRelationInput>;
type SortKey = keyof typeof SORTS;

export default function PointsAdminPage(props: PageProps<"/admin/points">) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageTitle title="Points d'apport" crumbs={["Points d'apport"]} />
        <Link href="/admin/points/nouveau" className="flex h-10 items-center gap-2 rounded bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus className="h-4 w-4" /> Nouveau point
        </Link>
      </div>
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Points {...props} />
        </Suspense>
      </Card>
    </>
  );
}

async function Points({ searchParams }: PageProps<"/admin/points">) {
  await requireRole(["admin"], "/admin/points");
  const sp = await searchParams;
  const q = str(sp, "q");
  const etat = oneOf(sp, "etat", ["actif", "inactif"] as const);
  const ok = str(sp, "ok");
  const materiau = str(sp, "materiau");
  const sort = sortParams(sp, Object.keys(SORTS) as SortKey[], { key: "nom", dir: "asc" });
  const { page, skip, take } = pageParams(sp);
  const listSp = { ...sp, ok: undefined };

  const where: Prisma.CollectionPointWhereInput = {
    ...(etat && { active: etat === "actif" }),
    ...(materiau && { acceptedMaterials: { some: { id: materiau } } }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
      ],
    }),
  };
  const [total, points, materials] = await Promise.all([
    prisma.collectionPoint.count({ where }),
    prisma.collectionPoint.findMany({ where, orderBy: [SORTS[sort.key](sort.dir), { id: "asc" }], skip, take, include: { _count: { select: { acceptedMaterials: true, declarations: true } } } }),
    prisma.material.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      {ok && OK_MESSAGES[ok] && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded bg-brand-light p-3 text-sm text-brand-dark"><CircleCheck className="h-4 w-4" /> {OK_MESSAGES[ok]}</p>
      )}
      <ListToolbar
        basePath="/admin/points"
        sp={listSp}
        placeholder="Nom, adresse, quartier…"
        filters={
          <>
            <SelectFilter name="etat" label="État" value={etat} options={[{ value: "actif", label: "Sur la carte" }, { value: "inactif", label: "Masqués" }]} />
            <SelectFilter name="materiau" label="Accepte" value={materiau} options={materials.map((m) => ({ value: m.id, label: m.name }))} />
          </>
        }
      />
      {points.length === 0 ? (
        <p className="py-6 text-center text-[#8a978c]">Aucun point ne correspond.</p>
      ) : (
        <SortableTable
          basePath="/admin/points"
          sp={listSp}
          sort={sort}
          columns={[
            { label: "Nom", sort: "nom" },
            { label: "Adresse", sort: "adresse" },
            { label: "Horaires", sort: "horaires" },
            { label: "Matériaux", sort: "materiaux" },
            { label: "Apports", sort: "apports" },
            { label: "État", sort: "etat" },
            { label: "Actions", align: "right" },
          ]}
        >
          {points.map((p) => (
            <tr key={p.id} className="hover:bg-[#fafcf9]">
              <td><Link href={`/admin/points/${p.id}`} className="font-semibold text-brand-dark hover:text-brand">{p.name}</Link></td>
              <td>{p.address}{p.district ? ` (${p.district})` : ""}</td>
              <td>{p.openingHours ?? "-"}</td>
              <td>{p._count.acceptedMaterials}</td>
              <td>{p._count.declarations}</td>
              <td>{p.active ? <Badge className="bg-green-100 text-green-800">Sur la carte</Badge> : <Badge className="bg-black/5 text-black/60">Masqué</Badge>}</td>
              <td className="text-right">
                <span className="inline-flex items-center gap-2">
                  <Link href={`/admin/points/${p.id}`} aria-label={`Modifier ${p.name}`} className="grid h-8 w-8 place-items-center rounded border border-[#e6ece3] hover:border-brand hover:text-brand">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <form action={deletePoint}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton message={`Supprimer « ${p.name} » ?`} className="h-8 rounded border border-red-200 px-2 text-xs font-semibold text-red-700 hover:bg-red-50">Supprimer</ConfirmButton>
                  </form>
                </span>
              </td>
            </tr>
          ))}
        </SortableTable>
      )}
      <Pagination basePath="/admin/points" sp={listSp} page={page} total={total} />
    </>
  );
}
