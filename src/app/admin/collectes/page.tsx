import Link from "next/link";
import { Suspense } from "react";
import { FieldFilter, ListToolbar, Pagination, SelectFilter, SortableTable } from "@/components/admin/list-toolbar";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import type { CollectionMode, DeclarationStatus, PaymentMethod } from "@/generated/prisma/enums";
import { dateRange, intParam, oneOf, pageParams, sortParams, str, type SortDir } from "@/lib/admin/list-params";
import { formatAriary } from "@/lib/format";
import { PAYOUT_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const STATUSES = Object.keys(STATUS_LABELS) as DeclarationStatus[];
const MODES: CollectionMode[] = ["ENLEVEMENT", "APPORT"];
const METHODS = Object.keys(PAYOUT_LABELS) as PaymentMethod[];

// Colonnes triables → tri Prisma (liste fermée : l'URL ne choisit jamais un champ arbitraire)
const SORTS = {
  numero: (dir: SortDir) => ({ id: dir }),
  date: (dir: SortDir) => ({ createdAt: dir }),
  declarant: (dir: SortDir) => ({ declarant: { name: dir } }),
  mode: (dir: SortDir) => ({ mode: dir }),
  lieu: (dir: SortDir) => ({ address: dir }),
  statut: (dir: SortDir) => ({ status: dir }),
  montant: (dir: SortDir) => ({ estimatedValue: dir }),
} satisfies Record<string, (dir: SortDir) => Prisma.WasteDeclarationOrderByWithRelationInput>;
type SortKey = keyof typeof SORTS;

export default function CollectionsAdminPage(props: PageProps<"/admin/collectes">) {
  return (
    <>
      <PageTitle title="Collectes" crumbs={["Collectes"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Declarations {...props} />
        </Suspense>
      </Card>
    </>
  );
}

async function Declarations({ searchParams }: PageProps<"/admin/collectes">) {
  await requireRole(["admin"], "/admin/collectes");
  const sp = await searchParams;
  const q = str(sp, "q");
  const statut = oneOf(sp, "statut", STATUSES);
  const mode = oneOf(sp, "mode", MODES);
  const paiement = oneOf(sp, "paiement", METHODS);
  const materiau = str(sp, "materiau");
  const min = intParam(sp, "min");
  const max = intParam(sp, "max");
  const sort = sortParams(sp, Object.keys(SORTS) as SortKey[], { key: "date", dir: "desc" });
  const { page, skip, take } = pageParams(sp);

  const where: Prisma.WasteDeclarationWhereInput = {
    ...(statut && { status: statut }),
    ...(mode && { mode }),
    ...(paiement && { payoutMethod: paiement }),
    ...(materiau && { items: { some: { materialId: materiau } } }),
    ...(dateRange(sp) && { createdAt: dateRange(sp) }),
    ...((min !== undefined || max !== undefined) && { estimatedValue: { ...(min !== undefined && { gte: min }), ...(max !== undefined && { lte: max }) } }),
    ...(q && {
      OR: [
        { declarant: { name: { contains: q, mode: "insensitive" } } },
        { declarant: { email: { contains: q, mode: "insensitive" } } },
        { payoutPhone: { contains: q.replace(/\s/g, "") } },
        { address: { contains: q, mode: "insensitive" } },
        { collectionPoint: { name: { contains: q, mode: "insensitive" } } },
        { id: { endsWith: q.toLowerCase() } },
      ],
    }),
  };

  const [total, rows, materials] = await Promise.all([
    prisma.wasteDeclaration.count({ where }),
    prisma.wasteDeclaration.findMany({
      where,
      orderBy: [SORTS[sort.key](sort.dir), { id: "desc" }],
      skip,
      take,
      include: { declarant: { select: { name: true } }, collectionPoint: { select: { name: true } } },
    }),
    prisma.material.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <>
      <ListToolbar
        basePath="/admin/collectes"
        sp={sp}
        placeholder="Déclarant, e-mail, téléphone, adresse, n°…"
        filters={
          <>
            <SelectFilter name="statut" label="Statut" value={statut} options={STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))} />
            <SelectFilter name="mode" label="Mode" value={mode} options={[{ value: "ENLEVEMENT", label: "Enlèvement" }, { value: "APPORT", label: "Apport" }]} />
          </>
        }
        advanced={
          <>
            <SelectFilter name="materiau" label="Matériau" value={materiau} options={materials.map((m) => ({ value: m.id, label: m.name }))} />
            <SelectFilter name="paiement" label="Paiement" value={paiement} options={METHODS.map((m) => ({ value: m, label: PAYOUT_LABELS[m] }))} />
            <FieldFilter name="du" label="Demandé du" type="date" value={str(sp, "du")} />
            <FieldFilter name="au" label="Au" type="date" value={str(sp, "au")} />
            <FieldFilter name="min" label="Estimation min (Ar)" type="number" value={str(sp, "min")} />
            <FieldFilter name="max" label="Estimation max (Ar)" type="number" value={str(sp, "max")} />
          </>
        }
      />
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[#8a978c]">Aucune collecte ne correspond.</p>
      ) : (
        <SortableTable
          basePath="/admin/collectes"
          sp={sp}
          sort={sort}
          columns={[
            { label: "N°", sort: "numero" },
            { label: "Date", sort: "date" },
            { label: "Déclarant", sort: "declarant" },
            { label: "Mode", sort: "mode" },
            { label: "Lieu", sort: "lieu" },
            { label: "Statut", sort: "statut" },
            { label: "Montant", sort: "montant", align: "right" },
          ]}
        >
          {rows.map((d) => (
            <tr key={d.id} className="hover:bg-[#fafcf9]">
              <td><Link href={`/admin/collectes/${d.id}`} className="font-semibold text-brand hover:underline">#{d.id.slice(-6).toUpperCase()}</Link></td>
              <td>{d.createdAt.toLocaleDateString("fr-FR")}</td>
              <td>{d.declarant.name}</td>
              <td>{d.mode === "APPORT" ? "Apport" : "Enlèvement"}</td>
              <td className="max-w-[240px] truncate">{d.collectionPoint?.name ?? d.address ?? "-"}</td>
              <td><Badge className={STATUS_COLORS[d.status]}>{STATUS_LABELS[d.status]}</Badge></td>
              <td className="text-right">
                {d.finalValue != null ? <strong>{formatAriary(d.finalValue)}</strong> : <span className="text-[#8a978c]">~{formatAriary(d.estimatedValue)}</span>}
              </td>
            </tr>
          ))}
        </SortableTable>
      )}
      <Pagination basePath="/admin/collectes" sp={sp} page={page} total={total} />
    </>
  );
}
