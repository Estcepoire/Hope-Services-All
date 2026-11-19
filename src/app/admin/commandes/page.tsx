import { revalidatePath, updateTag } from "next/cache";
import { Suspense } from "react";
import { Badge, Card, PageTitle } from "@/components/admin/ui";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { dateRange, intParam, oneOf, pageParams, sortParams, str, type Sort, type SortDir } from "@/lib/admin/list-params";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { FieldFilter, ListToolbar, Pagination, SelectFilter, SortableTable } from "@/components/admin/list-toolbar";
import { formatAriary } from "@/lib/format";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, PAYOUT_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

// Transitions autorisées : vérifiées sur le serveur, quelle que soit la requête reçue.
const NEXT: Record<OrderStatus, OrderStatus[]> = {
  EN_ATTENTE_PAIEMENT: ["PAYEE", "ANNULEE"],
  PAYEE: ["EXPEDIEE", "ANNULEE"],
  EXPEDIEE: ["LIVREE"],
  LIVREE: [],
  ANNULEE: [],
};

const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  PAYEE: "Paiement reçu",
  EXPEDIEE: "Expédiée",
  LIVREE: "Livrée",
  ANNULEE: "Annuler",
};

async function changeStatus(formData: FormData) {
  "use server";
  await requireRole(["admin"], "/admin/commandes");
  const id = String(formData.get("id"));
  const to = String(formData.get("to")) as OrderStatus;

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || !NEXT[order.status].includes(to)) throw new Error("Transition de statut non autorisée");

    // Mise à jour conditionnelle : deux clics simultanés ne peuvent pas appliquer deux fois la transition.
    const { count } = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: to } });
    if (count === 0) throw new Error("La commande a changé entre-temps");

    if (to === "PAYEE") {
      await tx.payment.updateMany({ where: { orderId: id, status: "EN_ATTENTE" }, data: { status: "REUSSI" } });
    }
    if (to === "ANNULEE") {
      // Remise en stock et remboursement des crédits utilisés.
      for (const item of order.items) {
        await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
      }
      if (order.creditsUsed > 0 && order.userId) {
        await tx.user.update({ where: { id: order.userId }, data: { creditBalance: { increment: order.creditsUsed } } });
      }
      await tx.payment.updateMany({ where: { orderId: id, status: "REUSSI" }, data: { status: "REMBOURSE" } });
      await tx.payment.updateMany({ where: { orderId: id, status: "EN_ATTENTE" }, data: { status: "ECHOUE" } });
    }
  });

  updateTag("products");
  revalidatePath("/admin/commandes");
}

export default function OrdersAdminPage(props: PageProps<"/admin/commandes">) {
  return (
    <>
      <PageTitle title="Commandes" crumbs={["Commandes"]} />
      <Card>
        <Suspense fallback={<p>Chargement…</p>}>
          <Orders {...props} />
        </Suspense>
      </Card>
    </>
  );
}

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];
const orderInclude = { items: { include: { product: { select: { name: true } } } }, payments: true } satisfies Prisma.OrderInclude;
type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;
const METHODS = ["MVOLA", "ORANGE_MONEY", "AIRTEL_MONEY", "ESPECES"] as const;

// Colonnes triables → tri Prisma (liste fermée)
const SORTS = {
  numero: (dir: SortDir) => ({ id: dir }),
  date: (dir: SortDir) => ({ createdAt: dir }),
  client: (dir: SortDir) => ({ customerName: dir }),
  articles: (dir: SortDir) => ({ items: { _count: dir } }),
  reception: (dir: SortDir) => ({ deliveryAddress: { sort: dir, nulls: "first" as const } }),
  statut: (dir: SortDir) => ({ status: dir }),
  montant: (dir: SortDir) => ({ total: dir }),
} satisfies Record<string, (dir: SortDir) => Prisma.OrderOrderByWithRelationInput>;
type SortKey = keyof typeof SORTS;

async function Orders({ searchParams }: PageProps<"/admin/commandes">) {
  await requireRole(["admin"], "/admin/commandes");
  const sp = await searchParams;
  const q = str(sp, "q");
  const statut = oneOf(sp, "statut", STATUSES);
  const paiement = oneOf(sp, "paiement", METHODS);
  const min = intParam(sp, "min");
  const max = intParam(sp, "max");
  const reception = oneOf(sp, "reception", ["livraison", "retrait"] as const);
  const sort = sortParams(sp, Object.keys(SORTS) as SortKey[], { key: "date", dir: "desc" });
  const { page, skip, take } = pageParams(sp);

  const where: Prisma.OrderWhereInput = {
    ...(statut && { status: statut }),
    ...(reception && { deliveryAddress: reception === "retrait" ? null : { not: null } }),
    ...(paiement && { payments: { some: { method: paiement } } }),
    ...(dateRange(sp) && { createdAt: dateRange(sp) }),
    ...((min !== undefined || max !== undefined) && { total: { ...(min !== undefined && { gte: min }), ...(max !== undefined && { lte: max }) } }),
    ...(q && {
      OR: [
        { customerName: { contains: q, mode: "insensitive" } },
        { customerPhone: { contains: q.replace(/\s/g, "") } },
        { deliveryAddress: { contains: q, mode: "insensitive" } },
        { id: { endsWith: q.toLowerCase() } },
        { items: { some: { product: { name: { contains: q, mode: "insensitive" } } } } },
      ],
    }),
  };

  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: [SORTS[sort.key](sort.dir), { id: "desc" }],
      skip,
      take,
      include: orderInclude,
    }),
  ]);

  return (
    <>
      <ListToolbar
        basePath="/admin/commandes"
        sp={sp}
        placeholder="Client, téléphone, n° de commande, produit…"
        filters={
          <>
            <SelectFilter name="statut" label="Statut" value={statut} options={STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABELS[s] }))} />
            <SelectFilter name="reception" label="Réception" value={reception} options={[{ value: "livraison", label: "Livraison" }, { value: "retrait", label: "Retrait" }]} />
          </>
        }
        advanced={
          <>
            <SelectFilter name="paiement" label="Paiement" value={paiement} options={METHODS.map((m) => ({ value: m, label: PAYOUT_LABELS[m] }))} />
            <FieldFilter name="du" label="Du" type="date" value={str(sp, "du")} />
            <FieldFilter name="au" label="Au" type="date" value={str(sp, "au")} />
            <FieldFilter name="min" label="Montant min (Ar)" type="number" value={str(sp, "min")} />
            <FieldFilter name="max" label="Montant max (Ar)" type="number" value={str(sp, "max")} />
          </>
        }
      />
      <OrderList orders={orders} sp={sp} sort={sort} />
      <Pagination basePath="/admin/commandes" sp={sp} page={page} total={total} />
    </>
  );
}

function OrderList({ orders, sp, sort }: { orders: OrderRow[]; sp: Record<string, string | string[] | undefined>; sort: Sort<SortKey> }) {
  if (orders.length === 0) return <p className="py-6 text-center text-[#8a978c]">Aucune commande ne correspond.</p>;

  return (
    <SortableTable
      basePath="/admin/commandes"
      sp={sp}
      sort={sort}
      columns={[
        { label: "N°", sort: "numero" },
        { label: "Date", sort: "date" },
        { label: "Client", sort: "client" },
        { label: "Articles", sort: "articles" },
        { label: "Réception", sort: "reception" },
        { label: "Paiement" },
        { label: "Statut", sort: "statut" },
        { label: "Montant", sort: "montant", align: "right" },
        { label: "Actions", align: "right" },
      ]}
    >
      {orders.map((o) => (
        <tr key={o.id} className="align-top hover:bg-[#fafcf9]">
          <td className="font-semibold text-brand-dark">#{o.id.slice(-6).toUpperCase()}</td>
          <td className="whitespace-nowrap">{o.createdAt.toLocaleDateString("fr-FR")}</td>
          <td>
            <span className="font-medium">{o.customerName}</span>
            <span className="block text-xs text-[#8a978c]">{o.customerPhone}</span>
          </td>
          <td className="max-w-[260px] text-xs text-[#5b6b5e]">{o.items.map((i) => `${i.quantity} × ${i.product.name}`).join(" · ")}</td>
          <td className="max-w-[200px] text-xs">{o.deliveryAddress ? `Livraison : ${o.deliveryAddress}` : "Retrait"}</td>
          <td className="whitespace-nowrap">{o.payments[0] ? PAYOUT_LABELS[o.payments[0].method] : "Crédits"}</td>
          <td><Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge></td>
          <td className="whitespace-nowrap text-right">
            <strong>{formatAriary(o.total)}</strong>
            {o.creditsUsed > 0 && <span className="block text-xs text-[#8a978c]">+ {formatAriary(o.creditsUsed)} crédits</span>}
          </td>
          <td>
            <div className="flex justify-end gap-1.5">
              {NEXT[o.status].map((to) => (
                <form key={to} action={changeStatus}>
                  <input type="hidden" name="id" value={o.id} />
                  <input type="hidden" name="to" value={to} />
                  {to === "ANNULEE" ? (
                    <ConfirmButton message="Annuler cette commande ? Le stock sera remis et les crédits remboursés." className="whitespace-nowrap rounded border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                      {ACTION_LABELS[to]}
                    </ConfirmButton>
                  ) : (
                    <button className="whitespace-nowrap rounded bg-brand px-2 py-1 text-xs font-semibold text-white hover:bg-brand-dark">{ACTION_LABELS[to]}</button>
                  )}
                </form>
              ))}
            </div>
          </td>
        </tr>
      ))}
    </SortableTable>
  );
}
