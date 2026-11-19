import Link from "next/link";
import { Suspense } from "react";
import { FieldFilter, ListToolbar, Pagination, SelectFilter } from "@/components/admin/list-toolbar";
import { Badge, Card, PageTitle, Table } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import type { CollectionMode, DeclarationStatus, PaymentMethod } from "@/generated/prisma/enums";
import { dateRange, oneOf, pageParams, str } from "@/lib/admin/list-params";
import { formatAriary } from "@/lib/format";
import { PAYOUT_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

const STATUSES = Object.keys(STATUS_LABELS) as DeclarationStatus[];
const MODES: CollectionMode[] = ["ENLEVEMENT", "APPORT"];
const METHODS = Object.keys(PAYOUT_LABELS) as PaymentMethod[];

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
  const { page, skip, take } = pageParams(sp);

  const where: Prisma.WasteDeclarationWhereInput = {
    ...(statut && { status: statut }),
    ...(mode && { mode }),
    ...(paiement && { payoutMethod: paiement }),
    ...(materiau && { items: { some: { materialId: materiau } } }),
    ...(dateRange(sp) && { createdAt: dateRange(sp) }),
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
      orderBy: { createdAt: "desc" },
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
          </>
        }
      />
      {rows.length === 0 ? (
        <p className="py-6 text-center text-[#8a978c]">Aucune collecte ne correspond.</p>
      ) : (
        <Table head={["N°", "Date", "Déclarant", "Mode", "Lieu", "Statut", "Montant"]}>
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
        </Table>
      )}
      <Pagination basePath="/admin/collectes" sp={sp} page={page} total={total} />
    </>
  );
}
