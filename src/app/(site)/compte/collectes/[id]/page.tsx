import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { QUALITY_LABELS } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";
import { PAYOUT_LABELS, SLOT_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Ma demande d'enlèvement", robots: { index: false } };

export default function DeclarationPage(props: PageProps<"/compte/collectes/[id]">) {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <Details {...props} />
    </Suspense>
  );
}

async function Details({ params, searchParams }: PageProps<"/compte/collectes/[id]">) {
  const { id } = await params;
  const { nouvelle } = await searchParams;
  const session = await requireRole([...APP_ROLES], `/compte/collectes/${id}`);

  const d = await prisma.wasteDeclaration.findUnique({
    where: { id },
    include: { items: { include: { material: { select: { name: true } } } } },
  });
  // Même réponse pour « inexistante » et « appartient à quelqu'un d'autre ».
  if (!d || d.declarantId !== session.user.id) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      {nouvelle && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">
          ✅ Demande envoyée ! Nous vous appelons pour confirmer le jour de passage.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Demande d&apos;enlèvement</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
      </div>

      <table className="w-full text-left text-sm">
        <thead className="border-b border-black/10 text-black/60">
          <tr><th className="py-2">Matériau</th><th>Qualité</th><th className="text-right">Estimé</th><th className="text-right">Pesé</th></tr>
        </thead>
        <tbody>
          {d.items.map((i) => (
            <tr key={i.id} className="border-b border-black/5">
              <td className="py-2">{i.material.name}</td>
              <td>{QUALITY_LABELS[i.quality]}</td>
              <td className="text-right">{i.estimatedKg} kg</td>
              <td className="text-right">{i.actualKg != null ? `${i.actualKg} kg` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <Item label="Adresse">{d.address}</Item>
        <Item label="Souhait">
          {d.preferredDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
          {d.preferredSlot ? `, ${SLOT_LABELS[d.preferredSlot]}` : ""}
        </Item>
        {d.scheduledAt && <Item label="Passage prévu">{d.scheduledAt.toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}</Item>}
        <Item label="Paiement">{PAYOUT_LABELS[d.payoutMethod]}{d.payoutPhone ? ` · ${d.payoutPhone}` : ""}</Item>
        <Item label={d.finalValue != null ? "Montant final" : "Estimation"}>
          <span className="text-lg font-bold text-brand">{formatAriary(d.finalValue ?? d.estimatedValue)}</span>
        </Item>
        {d.notes && <Item label="Précisions">{d.notes}</Item>}
      </dl>

      {d.photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {d.photoUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- photo privée servie par /api/uploads
            <img key={url} src={url} alt={`Photo ${i + 1}`} className="h-32 w-32 rounded-lg object-cover" />
          ))}
        </div>
      )}

      <Link href="/compte/collectes" className="text-brand underline">← Toutes mes collectes</Link>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-black/60">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
