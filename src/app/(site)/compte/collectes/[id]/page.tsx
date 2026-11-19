import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { APP_ROLES } from "@/auth";
import { RouteMap } from "@/components/route-map";
import { StatusTimeline } from "@/components/status-timeline";
import { DEPOT } from "@/lib/distance";
import { QUALITY_LABELS } from "@/lib/estimation";
import { formatAriary } from "@/lib/format";
import { PAYOUT_LABELS, SLOT_LABELS, STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { CircleCheck } from "lucide-react";

export const metadata: Metadata = { title: "Ma demande d'enlèvement", robots: { index: false } };

// Mise en page inspirée de Delivery (Dribbble) : fiche et suivi à gauche, carte du trajet à droite.
export default function DeclarationPage(props: PageProps<"/compte/collectes/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-surface" />}>
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

  const totalKg = d.items.reduce((s, i) => s + (i.actualKg ?? i.estimatedKg), 0);

  return (
    <div className="flex flex-col gap-6">
      {nouvelle && (
        <p role="status" className="flex items-center gap-3 rounded-2xl bg-brand-light p-4 font-medium text-brand-dark">
          <CircleCheck aria-hidden className="h-5 w-5 shrink-0" /> Demande envoyée ! Nous vous appelons pour confirmer le jour de passage.
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/compte/collectes" className="text-sm text-black/50 hover:text-brand">← Mes collectes</Link>
          <h1 className="mt-1 text-3xl font-extrabold">Enlèvement n° {d.id.slice(-6).toUpperCase()}</h1>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[d.status]}`}>{STATUS_LABELS[d.status]}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-2 rounded-3xl bg-surface p-5 text-center">
            <Stat label="Poids" value={`${totalKg} kg`} />
            <Stat label={d.finalValue != null ? "Payé" : "Estimé"} value={formatAriary(d.finalValue ?? d.estimatedValue)} highlight />
            <Stat label="Matériaux" value={String(d.items.length)} />
          </div>

          <div className="rounded-3xl bg-surface p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-black/50">Suivi</h2>
            <StatusTimeline status={d.status} dates={{ EN_ATTENTE: d.createdAt, PLANIFIEE: d.scheduledAt, COLLECTEE: d.collectedAt }} />
          </div>

          <dl className="flex flex-col gap-3 rounded-3xl bg-surface p-5 text-sm">
            <Item label="Adresse">{d.address}</Item>
            <Item label="Souhait">
              {d.preferredDate?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}
              {d.preferredSlot ? `, ${SLOT_LABELS[d.preferredSlot]}` : ""}
            </Item>
            <Item label="Paiement">{PAYOUT_LABELS[d.payoutMethod]}{d.payoutPhone ? ` · ${d.payoutPhone}` : ""}</Item>
            {d.notes && <Item label="Précisions">{d.notes}</Item>}
          </dl>
        </div>

        <div className="flex flex-col gap-4">
          <div className="h-[360px] overflow-hidden rounded-3xl bg-surface lg:h-auto lg:min-h-[420px] lg:flex-1">
            {d.lat != null && d.lng != null ? (
              <RouteMap from={DEPOT} to={{ lat: d.lat, lng: d.lng }} />
            ) : (
              <p className="grid h-full place-items-center text-black/50">Pas de position enregistrée.</p>
            )}
          </div>

          <div className="overflow-x-auto rounded-3xl bg-surface p-5">
            <table className="w-full text-left text-sm">
              <thead className="text-black/50">
                <tr><th className="pb-2">Matériau</th><th>Qualité</th><th className="text-right">Estimé</th><th className="text-right">Pesé</th></tr>
              </thead>
              <tbody>
                {d.items.map((i) => (
                  <tr key={i.id} className="border-t border-black/5">
                    <td className="py-2 font-medium">{i.material.name}</td>
                    <td>{QUALITY_LABELS[i.quality]}</td>
                    <td className="text-right">{i.estimatedKg} kg</td>
                    <td className="text-right">{i.actualKg != null ? `${i.actualKg} kg` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {d.photoUrls.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {d.photoUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- photo privée servie par /api/uploads
                <img key={url} src={url} alt={`Photo ${i + 1}`} className="h-28 w-28 rounded-2xl object-cover" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-black/50">{label}</p>
      <p className={`font-[family-name:var(--font-display)] font-extrabold ${highlight ? "text-brand" : ""}`}>{value}</p>
    </div>
  );
}

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-black/50">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
